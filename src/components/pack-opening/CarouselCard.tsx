import type { Card } from "../../types";
import { formatGems } from "../../constants/retail";
import { CollectibleImage } from "../ui/CollectibleImage";
import { RarityBadge } from "../ui/RarityBadge";

const rarityBorder: Record<Card["rarity"], string> = {
  Common: "border-border",
  Rare: "border-fuchsia/60",
  "Ancient Rare": "border-gold shadow-[0_0_16px_rgba(255,215,0,0.35)]",
};

interface CarouselCardProps {
  card: Card;
  width?: number;
  highlighted?: boolean;
  dimmed?: boolean;
}

export function CarouselCard({
  card,
  width = 128,
  highlighted,
  dimmed,
}: CarouselCardProps) {
  return (
    <div
      style={{ width }}
      className={`shrink-0 rounded-lg border-2 bg-[#121318] overflow-hidden transition-all duration-300 ${
        rarityBorder[card.rarity]
      } ${dimmed ? "opacity-35 scale-95" : "opacity-100"} ${
        highlighted ? "ring-2 ring-[#FF007F] scale-105 z-10" : ""
      }`}
    >
      <div
        className="border-b border-border p-1.5"
        style={{ height: Math.round(width * 0.86) }}
      >
        <CollectibleImage src={card.image} alt={card.name} />
      </div>
      <div className="px-2 py-1.5 space-y-0.5">
        <p className="text-[10px] font-semibold text-white truncate">{card.name}</p>
        <p className="text-[9px] font-bold text-gold tabular-nums">{formatGems(card.value)}</p>
        <RarityBadge rarity={card.rarity} />
      </div>
    </div>
  );
}
