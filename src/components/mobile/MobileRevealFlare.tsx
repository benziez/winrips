import { motion } from "framer-motion";
import type { RevealFlareMode } from "../../utils/revealPayoff";

interface MobileRevealFlareProps {
  mode: RevealFlareMode;
}

export function MobileRevealFlare({ mode }: MobileRevealFlareProps) {
  if (mode === "none") return null;

  const duration = mode === "gold-extended" ? 0.9 : 0.7;

  return (
    <motion.div
      aria-hidden
      className="mobile-reveal-flare pointer-events-none absolute inset-0 z-[11]"
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: [0, 1, 0.85, 0], scale: [0.55, 1.12, 1.05, 1.15] }}
      transition={{
        duration,
        ease: "easeOut",
        times: mode === "gold-extended" ? [0, 0.25, 0.55, 1] : [0, 0.3, 0.6, 1],
      }}
    />
  );
}
