import { useMemo } from "react";
import type { Pack, Rarity } from "../../types";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { getPackRollPool } from "../../data/boxCatalog";
import { CollectibleImage } from "../ui/CollectibleImage";
import {
  glowPaletteForCardRarity,
  glowPaletteForStoreRarity,
} from "../../utils/rarityGlowColors";
import type { StoreRarity } from "../../types/store";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import { resolveCollectibleImageSrc } from "../../utils/collectibleImageSrc";

export interface JustPulledTileDetail {
  name: string;
  itemId: string;
  value: number;
  image: string;
  rarity: Rarity;
}

interface JustPulledDetailModalProps {
  open: boolean;
  tile: JustPulledTileDetail | null;
  pack: Pack | null;
  onClose: () => void;
  onOpenPack: (pack: Pack) => void;
}

function rarityLabelForTile(tile: JustPulledTileDetail, pack: Pack | null): string {
  if (pack) {
    const storeItem = getPackRollPool(pack.id).find((entry) => entry.id === tile.itemId);
    if (storeItem?.rarity) return storeItem.rarity;
  }
  return tile.rarity;
}

export function JustPulledDetailModal({
  open,
  tile,
  pack,
  onClose,
  onOpenPack,
}: JustPulledDetailModalProps) {
  const rarityLabel = useMemo(
    () => (tile ? rarityLabelForTile(tile, pack) : "Rare"),
    [tile, pack],
  );

  const glowPalette = useMemo(() => {
    if (!tile) return glowPaletteForCardRarity("Rare");
    const storeRarities: StoreRarity[] = ["Common", "Rare", "Epic", "Legendary", "Mythic"];
    if (storeRarities.includes(rarityLabel as StoreRarity)) {
      return glowPaletteForStoreRarity(rarityLabel as StoreRarity);
    }
    return glowPaletteForCardRarity(tile.rarity);
  }, [tile, rarityLabel]);

  const imageSrc = useMemo(
    () => (tile ? resolveCollectibleImageSrc(tile.image, { thumbnail: false }) : ""),
    [tile],
  );

  if (!open || !tile) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-labelledby="just-pulled-card-name"
    >
      <button
        type="button"
        onClick={() => {
          void hapticTabSelect();
          onClose();
        }}
        aria-label="Close"
        className="absolute right-6 top-[max(0.5rem,env(safe-area-inset-top))] z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-light leading-none text-black shadow-[0_4px_20px_rgba(0,0,0,0.45)] active:bg-white/90"
      >
        ×
      </button>

      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overscroll-contain px-6"
        style={{
          paddingTop: 120,
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex w-full max-w-[360px] flex-col items-center text-center">
          <div className="relative mb-6 flex h-[min(42vh,260px)] w-[min(62vw,200px)] shrink-0 items-center justify-center">
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(circle at 50% 55%, rgba(${glowPalette.rgb}, 0.4), transparent 70%)`,
                filter: "blur(12px)",
              }}
            />
            <CollectibleImage
              src={imageSrc}
              alt={tile.name}
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.55)]"
              priority
              optimize={false}
              thumbnail={false}
              forceShow
              placeholderTintRgb={glowPalette.rgb}
            />
          </div>

          <p
            id="just-pulled-card-name"
            className="text-[22px] font-bold leading-tight tracking-tight text-white"
          >
            {tile.name}
          </p>

          <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--rip-text-muted)]">
            {rarityLabel}
          </p>

          <p className="mt-4 text-[32px] font-bold tabular-nums leading-none text-[var(--rip-green-bright)]">
            {formatUsd(gemsToUsd(tile.value))}
          </p>

          {pack ? (
            <button
              type="button"
              onClick={() => {
                void hapticTabSelect();
                onOpenPack(pack);
              }}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#ff007a] px-6 text-[14px] font-bold text-white shadow-[0_0_24px_rgba(255,0,122,0.35)] active:brightness-90"
            >
              Open This Pack →
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void hapticTabSelect();
              onClose();
            }}
            className={`${pack ? "mt-4" : "mt-6"} text-[15px] font-medium text-white active:opacity-70`}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
