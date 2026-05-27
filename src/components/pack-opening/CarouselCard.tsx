import type { Card } from "../../types";
import { formatGems } from "../../constants/retail";
import { CollectibleImage } from "../ui/CollectibleImage";
import { RarityBadge } from "../ui/RarityBadge";

function tierFrameClass(card: Card, highlighted?: boolean, compact?: boolean): string {
  if (highlighted && compact) return "mobile-carousel-card--centered scale-105 z-10";
  if (highlighted) return "glass-card--winner scale-105 z-10";
  if (compact) return "border border-[var(--rip-border)] bg-[var(--rip-surface)]";
  if (card.rarity === "Ancient Rare") return "glass-card tier-glow-grail hover:scale-[1.03]";
  if (card.rarity === "Rare") return "glass-card tier-glow-legendary hover:scale-[1.03]";
  return "glass-card hover:scale-[1.03]";
}

interface CarouselCardProps {
  card: Card;
  width?: number;
  highlighted?: boolean;
  dimmed?: boolean;
  /** Mobile spin: image + tiny name only — no price or badge. */
  compact?: boolean;
}

export function CarouselCard({
  card,
  width = 128,
  highlighted,
  dimmed,
  compact = false,
}: CarouselCardProps) {
  return (
    <div
      style={{ width }}
      className={`shrink-0 overflow-hidden rounded-lg transition-all duration-500 ease-out ${tierFrameClass(card, highlighted, compact)} ${
        dimmed ? "scale-95 opacity-30" : "opacity-100"
      }`}
    >
      <div
        className={`relative flex aspect-[2.5/3.5] w-full items-center justify-center ${
          compact ? "rounded-lg bg-[var(--rip-surface)] p-1.5" : "border-b border-border/60 bg-slate-elevated/30 p-2"
        }`}
      >
        <CollectibleImage
          src={card.image}
          alt={card.name}
          className="h-full w-full rounded-lg object-contain"
          optimize={compact ? false : undefined}
          priority={compact ? true : undefined}
        />
      </div>
      {compact ? (
        <p className="truncate px-1 pt-1.5 text-[11px] text-[var(--rip-text-muted)]">{card.name}</p>
      ) : (
        <div className="space-y-1 px-2.5 pt-2 pb-4 sm:pb-2.5">
          <p className="truncate text-[10px] font-semibold tracking-tight text-white">
            {card.name}
          </p>
          <p className="text-[9px] font-bold tabular-nums text-gold">{formatGems(card.value)}</p>
          <div className="mb-1">
            <RarityBadge rarity={card.rarity} />
          </div>
        </div>
      )}
    </div>
  );
}
