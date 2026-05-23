import { useMemo } from "react";
import { GemIcon } from "../icons/AppIcons";
import type { LobbyCategoryFilter } from "../../types";

const MOCK_WINS = [
  { user: "NovaRip", item: "Ember Coin", gems: 420 },
  { user: "VaultKing", item: "Neon Blade", gems: 890 },
  { user: "PackHunter", item: "Crystal Hoodie", gems: 1250 },
  { user: "RipLord", item: "PS5 Slim Console", gems: 2400 },
  { user: "GemStack", item: "Yeezy 350 V2", gems: 3100 },
  { user: "DropWave", item: "Charizard Holo", gems: 5200 },
  { user: "WinRipsPro", item: "Supreme Box Logo", gems: 780 },
  { user: "LuckyPull", item: "Umbreon VMAX", gems: 1650 },
];

interface LiveWinsTickerProps {
  categoryFilter?: LobbyCategoryFilter;
  embedded?: boolean;
}

function TickerPullCard({
  user,
  item,
  gems,
}: {
  user: string;
  item: string;
  gems: number;
}) {
  return (
    <article className="ticker-pull-card flex shrink-0 items-center gap-3 rounded-md px-3 py-1.5">
      <div className="min-w-0">
        <p className="truncate text-[11px] leading-tight">
          <span className="font-semibold text-white">{user}</span>
          <span className="mx-1.5 text-muted/60" aria-hidden>
            |
          </span>
          <span className="font-medium text-fuchsia">{item}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold tabular-nums text-gold">
          <GemIcon size={11} className="text-gold/90" />
          <span>{gems.toLocaleString()}</span>
        </p>
      </div>
    </article>
  );
}

export function LiveWinsTicker({
  categoryFilter: _categoryFilter = "all",
  embedded = false,
}: LiveWinsTickerProps) {
  const items = useMemo(() => [...MOCK_WINS, ...MOCK_WINS], []);

  return (
    <div
      className={`relative w-full overflow-hidden ${
        embedded ? "border-t border-border/80 bg-obsidian/90" : "border-b border-border bg-obsidian/98"
      }`}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-obsidian to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-obsidian to-transparent" />

      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.22em] text-fuchsia animate-live-pulse">
          Live
        </span>
        <span className="h-3.5 w-px shrink-0 bg-border/80" aria-hidden />
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track flex w-max items-center gap-4 pr-4">
            {items.map((win, index) => (
              <TickerPullCard
                key={`${win.user}-${win.item}-${index}`}
                user={win.user}
                item={win.item}
                gems={win.gems}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
