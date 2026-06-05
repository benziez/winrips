import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatUsd, gemsToUsd } from "../../../constants/retail";
import { useApp } from "../../../context/AppContext";
import { useAuth } from "../../../context/AuthContext";
import { createStripePaymentIntent } from "../../../lib/stripeDepositApi";
import { getStripeKeyDiagnostics, isStripeConfigured } from "../../../lib/stripeClient";
import {
  getDepositPaymentErrorMessage,
  presentDepositPaymentSheet,
} from "../../../lib/stripePaymentSheet";
import { BackspaceIcon, XIcon } from "../../icons/AppIcons";
import { RIP_SHEET_SPRING } from "./ripMotion";
import {
  hapticMediumImpact,
  hapticNotificationSuccess,
  hapticTabSelect,
} from "../../../utils/mobileHaptics";

const PRESETS = [5, 25, 50, 1000] as const;

/** Smallest preset tier (min $5) that covers a USD shortfall. */
export function defaultDepositUsdForShortfall(shortfallUsd: number): number {
  const need = Math.max(5, shortfallUsd);
  return PRESETS.find((preset) => preset >= need) ?? 1000;
}

interface AddFundsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (amountUsd: number) => void;
  defaultAmountUsd?: number;
}

export function AddFundsModal({
  open,
  onClose,
  onSuccess,
  defaultAmountUsd,
}: AddFundsModalProps) {
  const { session } = useAuth();
  const {
    goldVolts,
    userId,
    showErrorToast,
    showCashoutToast,
    syncGemBalanceFromServer,
    setAddFundsModalOpen,
  } = useApp();
  const [amountDigits, setAmountDigits] = useState("10");
  const [touched, setTouched] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  /** Keeps the sheet mounted while Stripe PaymentSheet is presented (survives parent re-renders). */
  const [holdOpenForPaymentSheet, setHoldOpenForPaymentSheet] = useState(false);
  /** Native Stripe / bridge error shown in-modal (survives short global toasts). */
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const sheetOpen = open || holdOpenForPaymentSheet;

  const amountUsd = Number.parseInt(amountDigits, 10) || 0;
  const displayAmount = formatUsd(amountUsd);
  const balanceLabel = formatUsd(gemsToUsd(goldVolts));

  useEffect(() => {
    setAddFundsModalOpen(sheetOpen);
    return () => setAddFundsModalOpen(false);
  }, [setAddFundsModalOpen, sheetOpen]);

  useEffect(() => {
    if (!open) return;
    setPaymentError(null);
    if (defaultAmountUsd != null && defaultAmountUsd > 0) {
      setAmountDigits(String(Math.round(defaultAmountUsd)));
      setTouched(true);
    }
  }, [open, defaultAmountUsd]);

  const appendDigit = useCallback((digit: string) => {
    if (isProcessing) return;
    setTouched(true);
    setAmountDigits((prev) => {
      const next = prev === "0" ? digit : `${prev}${digit}`;
      if (next.length > 5) return prev;
      return next.replace(/^0+(?=\d)/, "") || digit;
    });
  }, [isProcessing]);

  const backspace = useCallback(() => {
    if (isProcessing) return;
    setTouched(true);
    setAmountDigits((prev) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  }, [isProcessing]);

  const selectPreset = useCallback((usd: number) => {
    if (isProcessing) return;
    void hapticTabSelect();
    setTouched(true);
    setAmountDigits(String(usd));
  }, [isProcessing]);

  const handlePay = useCallback(async () => {
    if (isProcessing) return;

    if (amountUsd < 1) {
      showErrorToast("Minimum deposit is $1");
      return;
    }

    if (amountUsd > 10_000) {
      showErrorToast("Maximum deposit is $10,000");
      return;
    }

    if (!userId || !session?.access_token) {
      showErrorToast("Sign in required");
      return;
    }

    if (!isStripeConfigured()) {
      showErrorToast("Payments are not configured on this build.");
      return;
    }

    void hapticMediumImpact();
    setPaymentError(null);
    setIsProcessing(true);
    setHoldOpenForPaymentSheet(true);

    try {
      const { clientSecret, paymentIntentId, livemode } =
        await createStripePaymentIntent(amountUsd);

      const appKeys = getStripeKeyDiagnostics();
      const appMode = appKeys.keyMode;
      const piMode = livemode ? "live" : "test";

      console.info("[Stripe] PaymentIntent created", {
        paymentIntentId,
        amountUsd,
        paymentIntentLivemode: livemode,
        appPublishableKeyPrefix: appKeys.keyPrefix,
        appPublishableKeyMode: appMode,
      });

      if (appMode !== "missing" && appMode !== "unknown" && appMode !== piMode) {
        const mismatch = `Stripe key mismatch: app uses ${appKeys.keyPrefix} but PaymentIntent is ${piMode} (server secret is sk_${piMode}_). Use matching pk_${piMode}_ in VITE_STRIPE_PUBLISHABLE_KEY.`;
        console.error("[Stripe]", mismatch);
        setPaymentError(mismatch);
        showErrorToast(mismatch);
        return;
      }

      const outcome = await presentDepositPaymentSheet({
        paymentIntentClientSecret: clientSecret,
      });

      if (outcome === "canceled") {
        return;
      }

      void hapticNotificationSuccess();
      showCashoutToast(`$${amountUsd.toFixed(2)} added to your account`);

      await syncGemBalanceFromServer(userId);
      onSuccess?.(amountUsd);
      onClose();
    } catch (error) {
      const message = getDepositPaymentErrorMessage(error);
      console.error("[Stripe] deposit failed", error);
      setPaymentError(message);
      showErrorToast(message);
    } finally {
      setHoldOpenForPaymentSheet(false);
      setIsProcessing(false);
    }
  }, [
    amountUsd,
    isProcessing,
    onClose,
    onSuccess,
    session?.access_token,
    showCashoutToast,
    showErrorToast,
    syncGemBalanceFromServer,
    userId,
  ]);

  const handleApplePayClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      void handlePay();
    },
    [handlePay],
  );

  return (
    <AnimatePresence>
      {sheetOpen ? (
        <motion.div
          className="fixed inset-0 z-[10100] flex flex-col bg-[var(--rip-bg-primary)]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={RIP_SHEET_SPRING}
        >
          <button
            type="button"
            onClick={() => {
              if (isProcessing || holdOpenForPaymentSheet) return;
              void hapticTabSelect();
              onClose();
            }}
            disabled={isProcessing || holdOpenForPaymentSheet}
            className="absolute z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 p-2 text-white backdrop-blur-sm disabled:opacity-50"
            style={{ top: "calc(env(safe-area-inset-top) + 16px)", right: "16px" }}
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>

          <header
            className="flex shrink-0 items-center justify-center px-6 pb-4"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
          >
            <span className="rounded-full bg-[var(--rip-surface)] px-4 py-2 text-[13px] font-medium text-[var(--rip-text-muted)]">
              Balance: {balanceLabel}
            </span>
          </header>

          <div className="flex flex-1 flex-col px-6">
            {paymentError ? (
              <div
                role="alert"
                aria-live="assertive"
                className="mt-3 rounded-2xl border border-red-500/50 bg-red-950/90 px-4 py-3 text-left shadow-lg"
              >
                <p className="text-[13px] font-semibold uppercase tracking-wide text-red-300">
                  Payment failed
                </p>
                <p className="mt-2 break-words text-[15px] leading-snug text-red-50">
                  {paymentError}
                </p>
              </div>
            ) : null}

            <p
              className={`mt-4 text-center text-[64px] font-bold leading-none tabular-nums ${
                touched ? "text-[var(--rip-text-primary)]" : "text-[var(--rip-text-subtle)]"
              }`}
            >
              {displayAmount}
            </p>

            <button
              type="button"
              disabled={isProcessing}
              className="mx-auto mt-4 flex items-center gap-2 rounded-full bg-[var(--rip-surface)] px-5 py-2.5 text-[15px] font-medium text-white disabled:opacity-50"
              aria-label="Payment method"
            >
              <span aria-hidden></span>
              Apple Pay
              <span className="text-[var(--rip-text-muted)]">▼</span>
            </button>

            <div className="mt-8 flex gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  disabled={isProcessing}
                  className="flex-1 rounded-full bg-[var(--rip-surface-strong)] py-3 text-[15px] font-semibold text-white disabled:opacity-50"
                >
                  {formatUsd(preset)}
                </button>
              ))}
            </div>

            <div className="mt-8 grid flex-1 grid-cols-3 gap-y-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    void hapticTabSelect();
                    appendDigit(digit);
                  }}
                  disabled={isProcessing}
                  className="py-4 text-[32px] font-semibold text-white active:opacity-60 disabled:opacity-40"
                >
                  {digit}
                </button>
              ))}
              <span aria-hidden />
              <button
                type="button"
                onClick={() => {
                  void hapticTabSelect();
                  appendDigit("0");
                }}
                disabled={isProcessing}
                className="py-4 text-[32px] font-semibold text-white active:opacity-60 disabled:opacity-40"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  void hapticTabSelect();
                  backspace();
                }}
                disabled={isProcessing}
                className="flex items-center justify-center py-4 text-white active:opacity-60 disabled:opacity-40"
                aria-label="Backspace"
              >
                <BackspaceIcon size={28} />
              </button>
            </div>
          </div>

          <div
            className="shrink-0 px-6 pb-6"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={handleApplePayClick}
              disabled={isProcessing || amountUsd < 1}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-full bg-[var(--rip-surface-strong)] text-[17px] font-semibold text-white disabled:opacity-50"
            >
              {isProcessing ? (
                <span>{holdOpenForPaymentSheet ? "Complete payment…" : "Processing…"}</span>
              ) : (
                <>
                  <span aria-hidden></span>
                  Pay with Apple Pay
                </>
              )}
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
