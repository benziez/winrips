interface PackTileTopBadgesProps {
  topHitLabel: string;
  /** When set, shows the ∞ Infinite / Legendary badge on the left. */
  infiniteLabel?: string | null;
  /** Tailwind inset utilities for the badge row (e.g. `inset-x-2 top-2`). */
  insetClassName?: string;
  /** Lobby infinite row uses a shorter top-hit label without the "Top Hit" prefix. */
  compactTopHit?: boolean;
}

const INFINITE_BADGE_CLASS =
  "shrink-0 rounded-full border border-amber-400/40 bg-black/75 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-100";

const TOP_HIT_BADGE_CLASS =
  "min-w-0 truncate rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white";

export function PackTileTopBadges({
  topHitLabel,
  infiniteLabel,
  insetClassName = "inset-x-2 top-2",
  compactTopHit = false,
}: PackTileTopBadgesProps) {
  const hasInfinite = Boolean(infiniteLabel);

  return (
    <div
      className={`absolute z-20 flex items-center gap-1 ${insetClassName} ${
        hasInfinite ? "justify-between" : ""
      }`}
    >
      {hasInfinite ? (
        <span className={INFINITE_BADGE_CLASS}>{infiniteLabel}</span>
      ) : null}
      <span
        className={`${TOP_HIT_BADGE_CLASS} ${
          hasInfinite ? "max-w-[58%] shrink" : "max-w-[calc(100%-0.5rem)] shrink-0"
        }`}
      >
        {compactTopHit ? `🏆 ${topHitLabel}` : `🏆 Top Hit ${topHitLabel}`}
      </span>
    </div>
  );
}
