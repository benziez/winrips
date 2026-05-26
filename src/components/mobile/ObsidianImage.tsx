import { MysterySilhouette } from "./MysterySilhouette";

interface ObsidianImageProps {
  imgSrc: string;
  fallbackSrc: string;
  alt: string;
  onError: () => void;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

/**
 * Renders hook-resolved imagery; shows MysterySilhouette when src equals fallback.
 * Caller must wire useFallbackImageSrc / usePackCover — no asset-map imports here.
 */
export function ObsidianImage({
  imgSrc,
  fallbackSrc,
  alt,
  onError,
  className = "",
  imgClassName = "h-full w-full object-cover object-center",
  priority = false,
}: ObsidianImageProps) {
  const isMystery = imgSrc === fallbackSrc;

  if (isMystery) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        <MysterySilhouette />
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        className={imgClassName}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={onError}
      />
    </div>
  );
}
