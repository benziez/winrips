import type { Card } from "../../types";
import { formatGems } from "../../constants/retail";
import { CollectibleImage, CardBackPlaceholder } from "../ui/CollectibleImage";
import { resolveCollectibleImageSrc } from "../../utils/collectibleImageSrc";
import { RarityBadge } from "../ui/RarityBadge";
import { glowPaletteForCardRarity } from "../../utils/rarityGlowColors";

function tierFrameClass(card: Card, highlighted?: boolean, compact?: boolean): string {
  if (highlighted && compact) return "mobile-carousel-card--centered z-10";
  if (highlighted) return "glass-card--winner scale-105 z-10";
  if (compact) return "";
  if (card.rarity === "Ancient Rare") return "glass-card tier-glow-grail hover:scale-[1.03]";
  if (card.rarity === "Rare") return "glass-card tier-glow-legendary hover:scale-[1.03]";
  return "glass-card hover:scale-[1.03]";
}

interface CarouselCardProps {
  card: Card;
  /** Tape slot index — keeps image + label aligned under spin transforms. */
  slotIndex?: number;
  /** When true, only the winner slot shows the compact name label (reel landed). */
  winnerLabelOnly?: boolean;
  /** Center winner index — paired with winnerLabelOnly. */
  winnerIndex?: number;
  width?: number;
  highlighted?: boolean;
  dimmed?: boolean;
  /** Mobile spin: image + tiny name only — no price or badge. */
  compact?: boolean;
  /** When false, render only the card-back placeholder (off-window strip tiles). */
  showArt?: boolean;
  /** Slot-aligned preloaded Image (battle spinner GC pin). */
  preloadedImage?: HTMLImageElement;
}

function CompactSpinCardImage({
  card,
  slotIndex,
  tintRgb,
  preloadedImage,
}: {
  card: Card;
  slotIndex: number;
  tintRgb: string;
  preloadedImage?: HTMLImageElement;
}) {
  const pinnedSrc = preloadedImage?.src?.trim() ?? "";
  const catalogSrc = resolveCollectibleImageSrc(card.image?.trim() ?? "");
  const pinnedMatchesCatalog =
    pinnedSrc.length > 0 &&
    catalogSrc.length > 0 &&
    (pinnedSrc === catalogSrc ||
      pinnedSrc.endsWith(catalogSrc) ||
      catalogSrc.endsWith(pinnedSrc));

  if (!pinnedMatchesCatalog) {
    if (catalogSrc) {
      return (
        <CollectibleImage
          key={`spin-catalog-${slotIndex}-${card.id}-${catalogSrc}`}
          src={card.image}
          alt={card.name}
          className="h-full w-full rounded-lg object-contain"
          loading="eager"
          optimize={false}
          placeholderTintRgb={tintRgb}
        />
      );
    }
    return <CardBackPlaceholder tintRgb={tintRgb} className="h-full w-full" />;
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-transparent">
      <img
        key={`spin-img-${slotIndex}-${card.id}-${pinnedSrc}`}
        src={pinnedSrc}
        alt={card.name}
        className="relative z-[1] h-full w-full rounded-lg object-contain"
        loading="eager"
        fetchPriority="high"
        referrerPolicy="no-referrer"
        decoding="sync"
      />
    </div>
  );
}

export function CarouselCard({
  card,
  slotIndex = 0,
  winnerLabelOnly = false,
  winnerIndex,
  width = 128,
  highlighted,
  dimmed,
  compact = false,
  showArt = true,
  preloadedImage,
}: CarouselCardProps) {
  const tintRgb = glowPaletteForCardRarity(card.rarity).rgb;
  const showCompactLabel =
    compact &&
    (!winnerLabelOnly || winnerIndex == null || slotIndex === winnerIndex);
  return (
    <div
      style={{ width }}
      className={`shrink-0 overflow-hidden rounded-lg transition-opacity duration-500 ease-out ${tierFrameClass(card, highlighted, compact)} ${
        dimmed ? "opacity-35" : "opacity-100"
      }`}
    >
      <div
        className={`relative flex aspect-[2.5/3.5] w-full items-center justify-center ${
          compact
            ? "bg-transparent p-0"
            : "border-b border-border/60 bg-slate-elevated/30 p-2"
        }`}
      >
        {showArt ? (
          compact ? (
            <CompactSpinCardImage
              card={card}
              slotIndex={slotIndex}
              tintRgb={tintRgb}
              preloadedImage={preloadedImage}
            />
          ) : (
            <CollectibleImage
              src={card.image}
              alt={card.name}
              className="h-full w-full rounded-lg object-contain"
              loading="eager"
              optimize={false}
              placeholderTintRgb={tintRgb}
            />
          )
        ) : (
          <CardBackPlaceholder tintRgb={tintRgb} className="h-full w-full" />
        )}
      </div>
      {showCompactLabel ? (
        <p className="truncate px-1 pt-1.5 text-[11px] text-[var(--rip-text-muted)]">{card.name}</p>
      ) : !compact ? (
        <div className="space-y-1 px-2.5 pt-2 pb-4 sm:pb-2.5">
          <p className="truncate text-[10px] font-semibold tracking-tight text-white">
            {card.name}
          </p>
          <p className="text-[9px] font-bold tabular-nums text-gold">{formatGems(card.value)}</p>
          <div className="mb-1">
            <RarityBadge rarity={card.rarity} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
