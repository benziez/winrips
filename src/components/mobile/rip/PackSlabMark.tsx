interface PackSlabMarkProps {
  size?: number;
  className?: string;
}

/** Abstract graded-slab glyph for pack sheet headers. */
export function PackSlabMark({ size = 48, className = "" }: PackSlabMarkProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-[var(--rip-surface)] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={Math.round(size * 0.5)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 32 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pack-slab-fill" x1="16" y1="2" x2="16" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.22)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.06)" />
          </linearGradient>
          <linearGradient id="pack-slab-shine" x1="8" y1="4" x2="24" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(52,216,158,0.35)" />
            <stop offset="1" stopColor="rgba(52,216,158,0)" />
          </linearGradient>
        </defs>
        <rect x="4" y="2" width="24" height="36" rx="4" fill="url(#pack-slab-fill)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
        <rect x="4" y="2" width="24" height="36" rx="4" fill="url(#pack-slab-shine)" />
        <rect x="10" y="10" width="12" height="16" rx="2" fill="rgba(255,255,255,0.08)" />
      </svg>
    </div>
  );
}
