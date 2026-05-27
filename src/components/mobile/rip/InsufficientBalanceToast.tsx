import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RIP_SHEET_SPRING } from "./ripMotion";
import { hapticTabSelect } from "../../../utils/mobileHaptics";

interface InsufficientBalanceToastProps {
  visible: boolean;
  onDeposit: () => void;
  onDismiss: () => void;
  bottomOffset: string;
}

export function InsufficientBalanceToast({
  visible,
  onDeposit,
  onDismiss,
  bottomOffset,
}: InsufficientBalanceToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="rip-surface-glass fixed left-4 right-4 z-40 flex items-center gap-3 rounded-2xl border border-[var(--rip-border)] p-3.5"
          style={{ bottom: bottomOffset }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={RIP_SHEET_SPRING}
          role="status"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-white">Insufficient balance</p>
            <p className="mt-0.5 text-[13px] text-[var(--rip-text-muted)]">
              Make a deposit to spin this pack
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void hapticTabSelect();
              onDeposit();
            }}
            className="shrink-0 rounded-full bg-[var(--rip-orange)] px-4 py-2.5 text-[15px] font-semibold text-white"
          >
            Deposit
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
