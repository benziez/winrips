import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Browser } from "@capacitor/browser";
import { formatUsd, gemsToUsd } from "../../../constants/retail";
import { useApp } from "../../../context/AppContext";
import {
  createStripeConnectAccount,
  createStripeOnboardingLink,
  fetchStripeConnectStatus,
  submitStripeWithdrawal,
  type StripeConnectStatus,
} from "../../../lib/stripeWithdrawApi";
import { BackspaceIcon, XIcon } from "../../icons/AppIcons";
import { RIP_SHEET_SPRING } from "../rip/ripMotion";
import {
  hapticMediumImpact,
  hapticNotificationSuccess,
  hapticTabSelect,
} from "../../../utils/mobileHaptics";

const MIN_WITHDRAWAL_USD = 5;
const WEEKLY_CAP_USD = 250;

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

function centsToUsd(cents: number): number {
  return cents / 100;
}

export function WithdrawModal({ open, onClose }: WithdrawModalProps) {
  const {
    withdrawableBalance,
    showErrorToast,
    showCashoutToast,
    syncGemBalanceFromServer,
    setWithdrawModalOpen,
    userId,
  } = useApp();

  const [amountDigits, setAmountDigits] = useState("5");
  const [touched, setTouched] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);

  const amountUsd = Number.parseInt(amountDigits, 10) || 0;
  const displayAmount = formatUsd(amountUsd);

  const withdrawableGems =
    connectStatus?.withdrawableBalanceGems ?? withdrawableBalance;
  const withdrawableUsd = gemsToUsd(withdrawableGems);
  const weeklyRemainingUsd = centsToUsd(connectStatus?.weeklyRemainingCents ?? WEEKLY_CAP_USD * 100);
  const maxWithdrawUsd = Math.min(withdrawableUsd, weeklyRemainingUsd);
  const canWithdraw = Boolean(connectStatus?.payoutsEnabled);
  const belowMinimum = withdrawableUsd < MIN_WITHDRAWAL_USD;

  useEffect(() => {
    setWithdrawModalOpen(open);
    return () => setWithdrawModalOpen(false);
  }, [open, setWithdrawModalOpen]);

  const refreshStatus = useCallback(async () => {
    if (!userId) return;
    setStatusLoading(true);
    try {
      const status = await fetchStripeConnectStatus();
      setConnectStatus(status);
      await syncGemBalanceFromServer(userId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load withdrawal status.";
      showErrorToast(message);
    } finally {
      setStatusLoading(false);
    }
  }, [showErrorToast, syncGemBalanceFromServer, userId]);

  useEffect(() => {
    if (!open) return;
    void refreshStatus();
  }, [open, refreshStatus]);

  useEffect(() => {
    if (!open) return;

    const listener = Browser.addListener("browserFinished", () => {
      void refreshStatus();
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [open, refreshStatus]);

  const appendDigit = useCallback(
    (digit: string) => {
      if (isProcessing) return;
      setTouched(true);
      setAmountDigits((prev) => {
        const next = prev === "0" ? digit : `${prev}${digit}`;
        if (next.length > 4) return prev;
        const asUsd = Number.parseInt(next, 10) || 0;
        if (asUsd > maxWithdrawUsd) return prev;
        return next.replace(/^0+(?=\d)/, "") || digit;
      });
    },
    [isProcessing, maxWithdrawUsd],
  );

  const backspace = useCallback(() => {
    if (isProcessing) return;
    setTouched(true);
    setAmountDigits((prev) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  }, [isProcessing]);

  const handleSetupWithdrawals = useCallback(async () => {
    if (isProcessing || !userId) return;
    void hapticMediumImpact();
    setIsProcessing(true);

    try {
      if (!connectStatus?.stripeConnectAccountId) {
        await createStripeConnectAccount();
      }
      const url = await createStripeOnboardingLink();
      await Browser.open({ url });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Withdrawal setup failed. Please try again.";
      showErrorToast(message);
    } finally {
      setIsProcessing(false);
    }
  }, [connectStatus?.stripeConnectAccountId, isProcessing, showErrorToast, userId]);

  const handleWithdraw = useCallback(async () => {
    if (isProcessing || !canWithdraw) return;

    if (amountUsd < MIN_WITHDRAWAL_USD) {
      showErrorToast(`Minimum withdrawal is $${MIN_WITHDRAWAL_USD}`);
      return;
    }

    if (amountUsd > maxWithdrawUsd) {
      showErrorToast(`Maximum available is ${formatUsd(maxWithdrawUsd)}`);
      return;
    }

    void hapticMediumImpact();
    setIsProcessing(true);

    try {
      await submitStripeWithdrawal(amountUsd);
      void hapticNotificationSuccess();
      showCashoutToast(`$${amountUsd.toFixed(2)} withdrawal submitted`);
      await refreshStatus();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Withdrawal failed. Please try again.";
      showErrorToast(message);
    } finally {
      setIsProcessing(false);
    }
  }, [
    amountUsd,
    canWithdraw,
    isProcessing,
    maxWithdrawUsd,
    onClose,
    refreshStatus,
    showCashoutToast,
    showErrorToast,
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
              {statusLoading
                ? "Loading…"
                : `${formatUsd(withdrawableUsd)} withdrawable`}
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
            {!canWithdraw ? (
              <div className="mt-8 flex flex-1 flex-col items-center text-center">
                <h2 className="text-2xl font-bold text-white">Set up withdrawals</h2>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[var(--rip-text-muted)]">
                  Connect your bank through Stripe to cash out sale proceeds. Deposited funds stay
                  in-app for packs.
                </p>
                {belowMinimum ? (
                  <p className="mt-4 text-[14px] text-[var(--rip-text-muted)]">
                    You need at least {formatUsd(MIN_WITHDRAWAL_USD)} in withdrawable balance.
                  </p>
                ) : null}
              </div>
            ) : (
              <>
                <p
                  className={`mt-4 text-center text-[64px] font-bold leading-none tabular-nums ${
                    touched ? "text-[var(--rip-text-primary)]" : "text-[var(--rip-text-subtle)]"
                  }`}
                >
                  {displayAmount}
                </p>
                <p className="mt-3 text-center text-[15px] text-[var(--rip-text-muted)]">
                  {formatUsd(withdrawableUsd)} available to withdraw
                </p>
                <p className="mt-1 text-center text-[14px] text-[var(--rip-text-muted)]">
                  {formatUsd(weeklyRemainingUsd)} of {formatUsd(WEEKLY_CAP_USD)} weekly limit
                  remaining
                </p>

                <div className="mt-8 grid flex-1 grid-cols-3 gap-y-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => {
                        void hapticTabSelect();
                        appendDigit(digit);
                      }}
                      disabled={isProcessing || belowMinimum}
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
                    disabled={isProcessing || belowMinimum}
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
                    disabled={isProcessing || belowMinimum}
                    className="flex items-center justify-center py-4 text-white active:opacity-60 disabled:opacity-40"
                    aria-label="Backspace"
                  >
                    <BackspaceIcon size={28} />
                  </button>
                </div>
              </>
            )}
          </div>

          <div
            className="shrink-0 px-6 pb-6"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            {!canWithdraw ? (
              <button
                type="button"
                onClick={() => void handleSetupWithdrawals()}
                disabled={isProcessing || belowMinimum}
                className="flex h-16 w-full items-center justify-center rounded-full bg-[var(--rip-green)] text-[17px] font-semibold text-white disabled:opacity-50"
              >
                {isProcessing ? "Opening…" : "Set up withdrawals"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleWithdraw()}
                disabled={
                  isProcessing || belowMinimum || amountUsd < MIN_WITHDRAWAL_USD || amountUsd > maxWithdrawUsd
                }
                className="flex h-16 w-full items-center justify-center rounded-full bg-[var(--rip-green)] text-[17px] font-semibold text-white disabled:opacity-50"
              >
                {isProcessing ? "Processing…" : `Withdraw ${displayAmount}`}
              </button>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
