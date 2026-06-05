import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  OVERLAY_DISMISS_TRANSITION,
  RIP_SHEET_SPRING,
} from "./ripMotion";
import { XIcon } from "../../icons/AppIcons";
import { hapticTabSelect } from "../../../utils/mobileHaptics";

interface RipBottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  heightClass?: string;
  showClose?: boolean;
  dragToDismiss?: boolean;
  className?: string;
}

const SHEET_VARIANTS = {
  hidden: { y: "100%", opacity: 1 },
  visible: {
    y: 0,
    opacity: 1,
    transition: RIP_SHEET_SPRING,
  },
  dismiss: {
    opacity: 0,
    y: 20,
    transition: OVERLAY_DISMISS_TRANSITION,
  },
};

export function RipBottomSheet({
  open,
  onClose,
  children,
  zIndex = 90,
  heightClass = "h-[92dvh]",
  showClose = true,
  dragToDismiss = false,
  className = "",
}: RipBottomSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss"
            className="fixed inset-0 bg-black/60"
            style={{ zIndex: zIndex - 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={OVERLAY_DISMISS_TRANSITION}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`rip-surface-glass fixed inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-3xl border-t border-[var(--rip-border)] ${heightClass} ${className}`}
            style={{ zIndex }}
            variants={SHEET_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="dismiss"
            drag={dragToDismiss ? "y" : false}
            dragConstraints={dragToDismiss ? { top: 0, bottom: 0 } : undefined}
            dragElastic={dragToDismiss ? { top: 0, bottom: 0.45 } : undefined}
            onDragEnd={
              dragToDismiss
                ? (_, info) => {
                    if (info.offset.y > 72 || info.velocity.y > 420) onClose();
                  }
                : undefined
            }
          >
            {showClose ? (
              <button
                type="button"
                onClick={() => {
                  void hapticTabSelect();
                  onClose();
                }}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rip-surface)] text-white"
                aria-label="Close"
              >
                <XIcon size={20} />
              </button>
            ) : null}
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
