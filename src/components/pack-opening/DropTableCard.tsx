import type { PackDropEntry } from "../../data/packDropTables";
import { formatProbability } from "../../data/packDropTables";
import { formatGems } from "../../constants/retail";
import { CollectibleImage } from "../ui/CollectibleImage";

interface DropTableCardProps {
  entry: PackDropEntry;
  compact?: boolean;
}

const RARITY_PILL: Record<PackDropEntry["storeRarity"], string> = {
  Mythic: "border-gold/40 text-gold",
  Legendary: "border-fuchsia/40 text-fuchsia",
  Epic: "border-cyan/30 text-cyan",
  Rare: "border-white/20 text-white/90",
  Common: "border-border text-muted",
};

export function DropTableCard({ entry, compact }: DropTableCardProps) {
  const { card, probability, storeRarity } = entry;

  return (
    <article className="card-pack rounded-lg p-2.5 sm:p-3 flex flex-col gap-2 hover:border-fuchsia/25 transition-colors">
      <div
        className={`rounded-md border border-border overflow-hidden p-1 ${compact ? "h-14 sm:h-16" : "h-16"}`}
      >
        <CollectibleImage src={card.image} alt={card.name} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs font-semibold text-white leading-tight line-clamp-2 mb-1.5">
          {card.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs">
          <span className="font-bold tabular-nums text-[#FF007F]">{formatGems(card.value)}</span>
          <span className="text-slate-400" aria-hidden>
            ·
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ${RARITY_PILL[storeRarity]}`}
          >
            {storeRarity}
          </span>
          <span className="text-slate-400" aria-hidden>
            ·
          </span>
          <span className="font-medium text-slate-500 tabular-nums">
            {formatProbability(probability)} Chance
          </span>
        </div>
      </div>
    </article>
  );
}
