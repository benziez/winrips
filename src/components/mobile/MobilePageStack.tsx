import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PAGE_STACK_SPRING } from "./mobileTheme";
import { DismissPill } from "./DismissPill";

interface MobilePageStackProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  showDismiss?: boolean;
}

/**
 * Physical page stack — spring slide-up (not a web modal).
 */
export function MobilePageStack({
  open,
  onClose,
  children,
  zIndex = 90,
  showDismiss = true,
}: MobilePageStackProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    if (window.history.length > 1) {
      navigate(-1);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss"
            className="fixed inset-0 bg-black/70"
            style={{ zIndex: zIndex - 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-0 flex flex-col overflow-hidden bg-black"
            style={{ zIndex }}
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%", opacity: 0.92 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.92 }}
            transition={PAGE_STACK_SPRING}
          >
            {showDismiss ? (
              <DismissPill
                onClick={handleClose}
                className="absolute right-6 z-20"
                style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
              />
            ) : null}
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
