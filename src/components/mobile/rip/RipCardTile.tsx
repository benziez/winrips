import type { Card } from "../../../types";
import { formatUsd, gemsToUsd } from "../../../constants/retail";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../../hooks/useFallbackImageSrc";
import { resolveAssetUrl, isRenderableAssetUrl } from "../../../utils/resolveAssetUrl";
import { CARD_PLACEHOLDER_IMAGE } from "../../../constants/cardAssets";
import { ObsidianImage } from "../ObsidianImage";

interface RipCardTileProps {
  card: Card;
  showPrice?: boolean;
  className?: string;
  onPress?: () => void;
}

export function RipCardTile({ card, showPrice = true, className = "", onPress }: RipCardTileProps) {
  const remoteSrc = (() => {
    const trimmed = card.image?.trim() ?? "";
    const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
    return resolveAssetUrl(candidate);
  })();
  const { imgSrc, onError } = useFallbackImageSrc(remoteSrc, IMAGE_PLACEHOLDER);
  const priceLabel = formatUsd(gemsToUsd(card.value));

  const inner = (
    <>
      <div className="flex flex-1 items-center justify-center p-4">
        <ObsidianImage
          imgSrc={imgSrc}
          fallbackSrc={IMAGE_PLACEHOLDER}
          alt={card.name}
          onError={onError}
          imgClassName="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="border-t border-[var(--rip-border)] px-4 py-3">
        {showPrice ? (
          <p className="text-[20px] font-bold tabular-nums text-[var(--rip-green-bright)] rip-glow-price-green">
            {priceLabel}
          </p>
        ) : null}
        <p className={`text-[15px] font-medium text-white ${showPrice ? "mt-1" : ""}`}>{card.name}</p>
      </div>
    </>
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={`flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl bg-[var(--rip-surface)] text-left ${className}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={`flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl bg-[var(--rip-surface)] ${className}`}>
      {inner}
    </div>
  );
}
