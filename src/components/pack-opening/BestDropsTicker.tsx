import type { PackBestDrop } from "../../data/packDropTables";
import { formatGems } from "../../constants/retail";
import { AssetImage } from "../ui/AssetImage";

interface BestDropsTickerProps {
  drops: PackBestDrop[];
  packName: string;
}

export function BestDropsTicker({ drops, packName }: BestDropsTickerProps) {
  const items = [...drops, ...drops];

  return (
    <section className="rounded-lg border border-border bg-metallic overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-slate/80">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia" />
        </span>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white">
          Best Drops
        </h2>
        <span className="text-[10px] text-muted truncate">— {packName}</span>
      </div>
      <div className="relative overflow-hidden py-2">
        <div className="best-drops-track flex gap-3 w-max px-3">
          {items.map((drop, i) => (
            <article
              key={`${drop.id}-${i}`}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-obsidian px-3 py-1.5"
            >
              <div className="h-12 w-9 shrink-0 overflow-hidden rounded border border-border">
                <AssetImage src={drop.card.image} alt={drop.card.name} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate max-w-[120px] sm:max-w-none">
                  {drop.card.name}
                </p>
                <p className="text-[10px] text-muted">
                  <span className="text-fuchsia">{drop.username}</span>
                  <span className="mx-1">·</span>
                  <span className="text-gold font-bold">{formatGems(drop.card.value)}</span>
                  <span className="mx-1">·</span>
                  {drop.pulledAt}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
