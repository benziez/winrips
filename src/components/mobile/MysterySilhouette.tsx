import { GlassSurface } from "./GlassSurface";
import { OBSIDIAN_GOLD } from "./mobileTheme";

interface MysterySilhouetteProps {
  className?: string;
  label?: string;
}

/** On-brand placeholder when useFallbackImageSrc resolves to the mystery asset. */
export function MysterySilhouette({ className = "", label = "?" }: MysterySilhouetteProps) {
  return (
    <GlassSurface
      variant="none"
      className={`obsidian-mystery-silhouette flex h-full w-full items-center justify-center ${className}`}
      aria-hidden
    >
      <span
        className="select-none text-5xl font-light tracking-tight"
        style={{ color: OBSIDIAN_GOLD.bright, opacity: 0.35 }}
      >
        {label}
      </span>
    </GlassSurface>
  );
}
