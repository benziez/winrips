import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatUsd, gemsToUsd } from "../../../constants/retail";
import { useApp } from "../../../context/AppContext";
import { BackspaceIcon, XIcon } from "../../icons/AppIcons";
import { RIP_SHEET_SPRING } from "./ripMotion";
import { hapticMediumImpact, hapticTabSelect } from "../../../utils/mobileHaptics";

const PRESETS = [5, 25, 50, 1000] as const;

interface AddFundsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddFundsModal({ open, onClose }: AddFundsModalProps) {
  const { goldVolts, showErrorToast } = useApp();
  const [amountDigits, setAmountDigits] = useState("10");
  const [touched, setTouched] = useState(false);

  const amountUsd = Number.parseInt(amountDigits, 10) || 0;
  const displayAmount = formatUsd(amountUsd);
  const balanceLabel = formatUsd(gemsToUsd(goldVolts));

  const appendDigit = useCallback((digit: string) => {
    setTouched(true);
    setAmountDigits((prev) => {
      const next = prev === "0" ? digit : `${prev}${digit}`;
      if (next.length > 5) return prev;
      return next.replace(/^0+(?=\d)/, "") || digit;
    });
  }, []);

  const backspace = useCallback(() => {
    setTouched(true);
    setAmountDigits((prev) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  }, []);

  const selectPreset = useCallback((usd: number) => {
    void hapticTabSelect();
    setTouched(true);
    setAmountDigits(String(usd));
  }, []);

  const handlePay = useCallback(() => {
    void hapticMediumImpact();
    showErrorToast("Coming soon — top up at purchase.");
  }, [showErrorToast]);

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
                void hapticTabSelect();
                onClose();
              }}
              className="absolute right-6 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rip-surface)] text-white"
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
              className="mx-auto mt-4 flex items-center gap-2 rounded-full bg-[var(--rip-surface)] px-5 py-2.5 text-[15px] font-medium text-white"
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
                  className="flex-1 rounded-full bg-[var(--rip-surface-strong)] py-3 text-[15px] font-semibold text-white"
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
                  className="py-4 text-[32px] font-semibold text-white active:opacity-60"
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
                className="py-4 text-[32px] font-semibold text-white active:opacity-60"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  void hapticTabSelect();
                  backspace();
                }}
                className="flex items-center justify-center py-4 text-white active:opacity-60"
                aria-label="Backspace"
              >
                <BackspaceIcon size={28} />
              </button>
            </div>
          </div>

          <div
            className="shrink-0 px-6 pb-6"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={handlePay}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-full bg-[var(--rip-surface-strong)] text-[17px] font-semibold text-white"
            >
              <span aria-hidden></span>
              Pay with Apple Pay
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
