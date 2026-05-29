import { useEffect, useMemo, useState } from "react";
import type { PackCategory } from "../../types";
import { CARD_PLACEHOLDER_IMAGE } from "../../constants/cardAssets";
import {
  isSportsPlaceholderImage,
  SPORTS_PLACEHOLDER_IMAGE,
} from "../../constants/sportsAssets";
import { optimizedImageUrl } from "../../utils/optimizedImageUrl";
import { isRenderableAssetUrl } from "../../utils/resolveAssetUrl";

function isRenderableSrc(src?: string | null): src is string {
  if (!src?.trim()) return false;
  return (
    src.startsWith("https://") ||
    src.startsWith("http://") ||
    isRenderableAssetUrl(src)
  );
}

interface CollectibleImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  frameClassName?: string;
  /** @deprecated Category no longer affects fallback — placeholder is always local. */
  category?: PackCategory;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  /** Above-the-fold: eager load + high fetch priority. */
  priority?: boolean;
  /** Use smaller Pokemon TCG assets for grid/list contexts. */
  thumbnail?: boolean;
  /** Route through WebP proxy in production (disable for dense grids). */
  optimize?: boolean;
  /** Lock card frame ratio to prevent layout shift (omit when parent sets aspect). */
  aspectRatio?: string;
  /** Skip load-gated opacity and shimmer — show the image immediately. */
  forceShow?: boolean;
  /** Optional rarity rgb (e.g. "96, 165, 250") to tint the card-back placeholder. */
  placeholderTintRgb?: string;
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
      className={`relative mx-auto flex aspect-[2.5/3.5] h-full max-h-full w-full max-w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-slate data-[shell=mobile]:obsidian-mystery-silhouette data-[shell=mobile]:border-white/10 data-[shell=mobile]:bg-transparent ${className}`}
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

/** Card-like loading/fallback panel — rarity-tinted gradient + emblem, never raw gray. */
export function CardBackPlaceholder({
  tintRgb,
  className = "",
}: {
  tintRgb?: string;
  className?: string;
}) {
  const rgb = tintRgb?.trim() || "120, 132, 148";
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative flex items-center justify-center overflow-hidden rounded-lg ${className}`}
      style={{
        background: `radial-gradient(ellipse 82% 70% at 50% 42%, rgba(${rgb}, 0.45) 0%, rgba(${rgb}, 0.2) 46%, rgba(6, 8, 12, 0.96) 78%), linear-gradient(155deg, rgba(${rgb}, 0.3), rgba(0, 0, 0, 0.6))`,
        boxShadow: `inset 0 0 0 1px rgba(${rgb}, 0.35), inset 0 0 26px rgba(${rgb}, 0.18)`,
      }}
    >
      {/* Inner card-back frame */}
      <div
        className="absolute inset-[7%] rounded-md"
        style={{
          border: `1px solid rgba(${rgb}, 0.4)`,
          boxShadow: `inset 0 0 14px rgba(${rgb}, 0.22)`,
        }}
      />
      {/* Diagonal sheen for a printed card-back feel */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 9px)`,
          opacity: 0.5,
        }}
      />
      <svg
        viewBox="0 0 48 64"
        className="relative h-[42%] w-auto"
        fill="none"
        stroke={`rgba(${rgb}, 1)`}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ opacity: 0.62, filter: `drop-shadow(0 0 6px rgba(${rgb}, 0.55))` }}
      >
        <path d="M24 6 L40 16 L40 40 L24 58 L8 40 L8 16 Z" />
        <path d="M16 22 L24 30 L32 22 M24 30 L24 44" opacity="0.75" />
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
  loading = "lazy",
  fetchPriority,
  priority = false,
  thumbnail = true,
  optimize = true,
  aspectRatio,
  forceShow = false,
  placeholderTintRgb,
}: CollectibleImageProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => resolveInitialMode(src));
  const [loaded, setLoaded] = useState(false);
  const [retryDirectUrl, setRetryDirectUrl] = useState(false);

  useEffect(() => {
    setDisplayMode(resolveInitialMode(src));
    setLoaded(false);
    setRetryDirectUrl(false);
  }, [src]);

  const resolvedLoading = priority ? "eager" : loading;
  const resolvedFetchPriority = priority ? "high" : fetchPriority;

  const showSlab = displayMode === "slab";
  const rawImageSrc = srcForMode(src, displayMode);

  const imageSrc = useMemo(() => {
    if (showSlab) {
      return rawImageSrc;
    }

    // Hard bypass: lobby grids pass optimize={false} for direct Pokémon TCG / local URLs.
    if (optimize === false) {
      if (displayMode === "primary" && typeof src === "string" && src.trim()) {
        return src.trim();
      }
      return rawImageSrc;
    }

    if (displayMode !== "primary" || !isRenderableSrc(rawImageSrc)) {
      return rawImageSrc;
    }

    if (retryDirectUrl) {
      return optimizedImageUrl(rawImageSrc, {
        thumbnail: thumbnail && !priority,
        optimize: false,
      });
    }

    return optimizedImageUrl(rawImageSrc, {
      thumbnail: thumbnail && !priority,
      optimize,
    });
  }, [displayMode, optimize, priority, rawImageSrc, retryDirectUrl, showSlab, src, thumbnail]);

  function handleImageError() {
    const canRetryDirect =
      !retryDirectUrl &&
      optimize &&
      displayMode === "primary" &&
      isRenderableSrc(rawImageSrc);

    if (canRetryDirect) {
      setLoaded(false);
      setRetryDirectUrl(true);
      return;
    }

    setLoaded(false);
    setDisplayMode((current) => (current === "primary" ? "placeholder" : current));
  }

  const imgAspectRatio = aspectRatio ?? "1 / 1";
  const imgSizeStyle = {
    aspectRatio: imgAspectRatio,
    width: "100%",
    height: "100%",
  } as const;

  if (forceShow && !showSlab) {
    return (
      <div
        className={`collectible-image-frame relative flex h-full w-full items-center justify-center overflow-hidden bg-transparent ${frameClassName}`}
      >
        <CardBackPlaceholder tintRgb={placeholderTintRgb} className="absolute inset-0" />
        {displayMode === "primary" ? (
          <img
            src={imageSrc}
            alt={alt}
            className={`${className} relative z-[1] opacity-100`}
            style={imgSizeStyle}
            loading={resolvedLoading}
            fetchPriority={resolvedFetchPriority}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`collectible-image-frame relative flex h-full w-full items-center justify-center overflow-hidden bg-transparent ${frameClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {showSlab ? (
        <LuxurySlabFrame alt={alt} className={className} />
      ) : (
        <>
          <CardBackPlaceholder tintRgb={placeholderTintRgb} className="absolute inset-0" />
          {displayMode === "primary" ? (
            <img
              src={imageSrc}
              alt={alt}
              className={`${className} relative z-[1] transition-opacity duration-200 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              style={aspectRatio ? { aspectRatio: imgAspectRatio, width: "100%", height: "100%" } : imgSizeStyle}
              loading={resolvedLoading}
              fetchPriority={resolvedFetchPriority}
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setLoaded(true)}
              onError={handleImageError}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export { SPORTS_PLACEHOLDER_IMAGE, isSportsPlaceholderImage };
