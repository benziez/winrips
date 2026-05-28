import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PaymentSheetEventsEnum } from "@capacitor-community/stripe";
import { formatUsd, gemsToUsd } from "../../../constants/retail";
import { useApp } from "../../../context/AppContext";
import { useAuth } from "../../../context/AuthContext";
import { createStripePaymentIntent } from "../../../lib/stripeDepositApi";
import { isStripeConfigured, Stripe } from "../../../lib/stripeClient";
import { BackspaceIcon, XIcon } from "../../icons/AppIcons";
import { RIP_SHEET_SPRING } from "./ripMotion";
import {
  hapticMediumImpact,
  hapticNotificationSuccess,
  hapticTabSelect,
} from "../../../utils/mobileHaptics";

const PRESETS = [5, 25, 50, 1000] as const;
const APPLE_PAY_MERCHANT_ID = "merchant.com.winrips.app";

interface AddFundsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddFundsModal({ open, onClose }: AddFundsModalProps) {
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

  const amountUsd = Number.parseInt(amountDigits, 10) || 0;
  const displayAmount = formatUsd(amountUsd);
  const balanceLabel = formatUsd(gemsToUsd(goldVolts));

  useEffect(() => {
    setAddFundsModalOpen(open);
    return () => setAddFundsModalOpen(false);
  }, [open, setAddFundsModalOpen]);

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
    setIsProcessing(true);

    try {
      const { clientSecret } = await createStripePaymentIntent(amountUsd);

      await Stripe.createPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "WinRips",
        enableApplePay: true,
        applePayMerchantId: APPLE_PAY_MERCHANT_ID,
        countryCode: "US",
        style: "alwaysDark",
      });

      const result = await Stripe.presentPaymentSheet();

      if (result.paymentResult === PaymentSheetEventsEnum.Completed) {
        void hapticNotificationSuccess();
        showCashoutToast(`$${amountUsd.toFixed(2)} added to your account`);

        window.setTimeout(() => {
          void syncGemBalanceFromServer(userId);
        }, 2000);

        onClose();
        return;
      }

      if (result.paymentResult === PaymentSheetEventsEnum.Canceled) {
        return;
      }

      showErrorToast("Payment did not complete. Please try again.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Payment failed. Please try again.";
      showErrorToast(message);
    } finally {
      setIsProcessing(false);
    }
  }, [
    amountUsd,
    isProcessing,
    onClose,
    session?.access_token,
    showCashoutToast,
    showErrorToast,
    syncGemBalanceFromServer,
    userId,
  ]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col bg-[var(--rip-bg-primary)]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={RIP_SHEET_SPRING}
        >
          <header
            className="relative flex shrink-0 items-center justify-center px-6 pb-4"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <span className="rounded-full bg-[var(--rip-surface)] px-4 py-2 text-[13px] font-medium text-[var(--rip-text-muted)]">
              Balance: {balanceLabel}
            </span>
            <button
              type="button"
              onClick={() => {
                if (isProcessing) return;
                void hapticTabSelect();
                onClose();
              }}
              disabled={isProcessing}
              className="absolute right-6 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rip-surface)] text-white disabled:opacity-50"
              aria-label="Close"
            >
              <XIcon size={20} />
            </button>
          </header>

          <div className="flex flex-1 flex-col px-6">
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
              onClick={() => void handlePay()}
              disabled={isProcessing || amountUsd < 1}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-full bg-[var(--rip-surface-strong)] text-[17px] font-semibold text-white disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Processing…</span>
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
