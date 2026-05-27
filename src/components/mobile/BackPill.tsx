import { ChevronLeft } from "../icons/AppIcons";
import { GlassSurface } from "./GlassSurface";
interface BackPillProps {
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Top-leading glass circle with back chevron — same surface as DismissPill. */
export function BackPill({ onClick, className = "", style }: BackPillProps) {
  return (
    <GlassSurface
      as="button"
      type="button"
      onClick={onClick}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:opacity-80 ${className}`}
      style={style}
      aria-label="Back"
    >
      <ChevronLeft size={22} className="text-[#F2D680]" />
    </GlassSurface>
  );
}
