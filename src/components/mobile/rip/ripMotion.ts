/** Framer Motion spring — stiffness 300, damping 30 */
export const RIP_SHEET_SPRING = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

/** Cinematic dismiss — fade + slight drop before underlying screen shows. */
export const OVERLAY_DISMISS_EXIT = { opacity: 0, y: 20 };

export const OVERLAY_DISMISS_TRANSITION = { duration: 0.2 };
