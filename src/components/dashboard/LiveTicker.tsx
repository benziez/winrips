import { RECENT_DROPS } from "../../data/cards";
import { RarityBadge } from "../ui/RarityBadge";

export function LiveTicker() {
  const items = [...RECENT_DROPS, ...RECENT_DROPS];

  return (
    <div className="relative w-full rounded-lg bg-slate border border-border overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate to-transparent z-10 pointer-events-none" />

      <div className="flex items-center gap-3 py-2.5 px-3 sm:px-4">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-fuchsia animate-live-pulse">
          Live Drops
        </span>
        <div className="h-4 w-px bg-border shrink-0" />
        <div className="overflow-hidden flex-1 min-w-0">
          <div className="ticker-track flex w-max gap-6 pr-6">
            {items.map((drop, i) => (
              <div
                key={`${drop.id}-${i}`}
                className="flex items-center gap-2 shrink-0 text-xs sm:text-sm"
              >
                <span>{drop.avatar}</span>
                <span className="text-muted">{drop.username}</span>
                <span className="text-white/70">pulled</span>
                <span className="text-white font-medium">{drop.item}</span>
                <RarityBadge rarity={drop.rarity} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
