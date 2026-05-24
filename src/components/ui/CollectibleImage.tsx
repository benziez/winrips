import { useEffect, useState } from "react";
import type { PackCategory } from "../../types";
import { CARD_PLACEHOLDER_IMAGE } from "../../constants/cardAssets";
import {
  isSportsPlaceholderImage,
  SPORTS_PLACEHOLDER_IMAGE,
} from "../../constants/sportsAssets";

function isRenderableSrc(src?: string | null): src is string {
  if (!src?.trim()) return false;
  return (
    src.startsWith("https://") ||
    src.startsWith("http://") ||
    src.startsWith("/")
  );
}

interface CollectibleImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  frameClassName?: string;
  /** @deprecated Category no longer affects fallback — placeholder is always local. */
  category?: PackCategory;
}

function LuxurySlabFrame({
  alt = "Collectible",
  className = "",
}: {
  alt?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto flex aspect-[2.5/3.5] h-full max-h-full w-full max-w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-slate ${className}`}
      role="img"
      aria-label={alt}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_32%,rgba(255,0,122,0.06),transparent_62%)]"
        aria-hidden
      />
      <svg
        viewBox="0 0 56 72"
        className="relative h-[42%] w-auto text-[#FF007F]/20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="6" y="10" width="28" height="38" rx="2.5" transform="rotate(-10 20 29)" />
        <rect x="14" y="14" width="28" height="38" rx="2.5" />
        <rect x="22" y="18" width="28" height="38" rx="2.5" transform="rotate(10 36 37)" />
        <path d="M18 58h20M28 50v16" opacity="0.35" />
      </svg>
    </div>
  );
}

type DisplayMode = "primary" | "placeholder" | "slab";

function resolveInitialMode(src?: string | null): DisplayMode {
  if (isSportsPlaceholderImage(src)) return "slab";
  if (!isRenderableSrc(src)) return "placeholder";
  return "primary";
}

function srcForMode(src: string | null | undefined, mode: DisplayMode): string {
  if (mode === "placeholder") return CARD_PLACEHOLDER_IMAGE;
  if (mode === "primary" && isRenderableSrc(src)) return src;
  return CARD_PLACEHOLDER_IMAGE;
}

/**
 * Renders collectible art — missing or failed loads use a local placeholder, not card backs.
 */
export function CollectibleImage({
  src,
  alt = "Collectible",
  className = "h-full w-full object-contain",
  frameClassName = "",
}: CollectibleImageProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => resolveInitialMode(src));

  useEffect(() => {
    setDisplayMode(resolveInitialMode(src));
  }, [src]);

  function handleImageError() {
    setDisplayMode((current) => {
      if (current === "primary") return "placeholder";
      if (current === "placeholder") return "slab";
      return current;
    });
  }

  const showSlab = displayMode === "slab";
  const imageSrc = srcForMode(src, displayMode);

  return (
    <div
      className={`flex h-full w-full items-center justify-center overflow-hidden bg-slate-elevated/30 ${frameClassName}`}
    >
      {showSlab ? (
        <LuxurySlabFrame alt={alt} className={className} />
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleImageError}
        />
      )}
    </div>
  );
}

export { SPORTS_PLACEHOLDER_IMAGE, isSportsPlaceholderImage };
