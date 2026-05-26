import { GlassSurface } from "./GlassSurface";
import { OBSIDIAN_GOLD } from "./mobileTheme";

interface DismissPillProps {
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Top-trailing glass circle with × — stack dismiss (handler unchanged by caller). */
export function DismissPill({ onClick, className = "", style }: DismissPillProps) {
  return (
    <GlassSurface
      as="button"
      type="button"
      onClick={onClick}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:opacity-80 ${className}`}
      style={style}
      aria-label="Close"
    >
      <span className="text-xl leading-none" style={{ color: OBSIDIAN_GOLD.bright }}>
        ×
      </span>
    </GlassSurface>
  );
}
