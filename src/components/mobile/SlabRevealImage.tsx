import { useMemo } from "react";
import type { Card } from "../../types";
import { resolveAssetUrl, isRenderableAssetUrl } from "../../utils/resolveAssetUrl";
import { CARD_PLACEHOLDER_IMAGE } from "../../constants/cardAssets";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../hooks/useFallbackImageSrc";
import { GlassSurface } from "./GlassSurface";
import { ObsidianImage } from "./ObsidianImage";

interface SlabRevealImageProps {
  card: Card;
  priority?: boolean;
}

export function SlabRevealImage({ card, priority = true }: SlabRevealImageProps) {
  const resolvedSrc = useMemo(() => {
    const trimmed = card.image?.trim() ?? "";
    const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
    return resolveAssetUrl(candidate);
  }, [card.image]);

  const { imgSrc, onError } = useFallbackImageSrc(resolvedSrc, IMAGE_PLACEHOLDER);

  return (
    <GlassSurface
      variant="default"
      className="relative mx-auto aspect-[2.5/3.5] h-[min(70dvh,520px)] w-auto max-w-[min(88vw,340px)] overflow-hidden rounded-xl p-0"
    >
      <ObsidianImage
        imgSrc={imgSrc}
        fallbackSrc={IMAGE_PLACEHOLDER}
        alt={card.name}
        onError={onError}
        priority={priority}
        imgClassName="absolute inset-0 h-full w-full object-contain object-center"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_38%,rgba(242,214,128,0.1)_48%,transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/30"
        aria-hidden
      />
    </GlassSurface>
  );
}
