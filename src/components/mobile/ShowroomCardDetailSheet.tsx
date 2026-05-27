import { useMemo } from "react";
import type { Card } from "../../types";
import type { StoreRarity } from "../../types/store";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../hooks/useFallbackImageSrc";
import { resolveAssetUrl, isRenderableAssetUrl } from "../../utils/resolveAssetUrl";
import { CARD_PLACEHOLDER_IMAGE } from "../../constants/cardAssets";
import { MobilePageStack } from "./MobilePageStack";
import { BackPill } from "./BackPill";
import { GlassSurface } from "./GlassSurface";
import { ObsidianImage } from "./ObsidianImage";
import { storeRarityLabelStyle } from "./mobileTheme";

interface ShowroomCardDetailSheetProps {
  card: Card;
  storeRarity: StoreRarity;
  open: boolean;
  onClose: () => void;
}

export function ShowroomCardDetailSheet({
  card,
  storeRarity,
  open,
  onClose,
}: ShowroomCardDetailSheetProps) {
  const remoteSrc = useMemo(() => {
    const trimmed = card.image?.trim() ?? "";
    const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
    return resolveAssetUrl(candidate);
  }, [card.image]);
  const { imgSrc, onError } = useFallbackImageSrc(remoteSrc, IMAGE_PLACEHOLDER);
  const priceLabel = formatUsd(gemsToUsd(card.value));
  const accentStyle = storeRarityLabelStyle(storeRarity);

  return (
    <MobilePageStack open={open} onClose={onClose} zIndex={85} showDismiss={false}>
      <div className="relative flex min-h-0 flex-1 flex-col bg-black">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0c] to-black"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 38%, ${accentStyle.color ?? "transparent"}22, transparent 70%)`,
          }}
          aria-hidden
        />

        <BackPill
          onClick={onClose}
          className="absolute left-6 z-20"
          style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-8 pt-[calc(max(0.5rem,env(safe-area-inset-top))+3.5rem)]">
          <GlassSurface
            variant="default"
            className="relative aspect-[2.5/3.5] h-[min(58dvh,480px)] w-auto max-w-[min(88vw,360px)] overflow-hidden rounded-2xl p-0"
          >
            <ObsidianImage
              imgSrc={imgSrc}
              fallbackSrc={IMAGE_PLACEHOLDER}
              alt={card.name}
              onError={onError}
              imgClassName="h-full w-full object-contain object-center"
            />
          </GlassSurface>

          <div className="mt-6 w-full max-w-[min(88vw,360px)] shrink-0 text-center">
            <h2 className="text-xl font-semibold leading-snug text-white">{card.name}</h2>
            <p
              className="mt-2 text-3xl font-bold tabular-nums tracking-tight"
              style={accentStyle}
            >
              {priceLabel}
            </p>
          </div>
        </div>
      </div>
    </MobilePageStack>
  );
}
