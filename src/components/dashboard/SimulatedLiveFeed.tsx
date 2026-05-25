import { useEffect, useMemo, useState } from "react";
import { GemIcon } from "../icons/AppIcons";
import {
  createSimulatedWin,
  seedSimulatedWins,
  SIMULATED_FEED_INTERVAL_MAX_MS,
  SIMULATED_FEED_INTERVAL_MIN_MS,
  SIMULATED_FEED_MAX_WINS,
  type SimulatedWin,
} from "../../data/simulatedLiveFeed";
import type { LobbyCategoryFilter } from "../../types";

interface SimulatedLiveFeedProps {
  categoryFilter?: LobbyCategoryFilter;
  embedded?: boolean;
}

function TickerPullCard({
  win,
  isNewest,
  ariaHidden = false,
}: {
  win: SimulatedWin;
  isNewest: boolean;
  ariaHidden?: boolean;
}) {
  return (
    <article
      aria-hidden={ariaHidden || undefined}
      className={`ticker-pull-card flex shrink-0 items-center gap-3 rounded-md px-3 py-1.5 ${
        isNewest ? "animate-feed-row-enter" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-[11px] leading-tight">
          <span className="font-semibold text-white">{win.username}</span>
          <span className="mx-1.5 text-muted/60" aria-hidden>
            |
          </span>
          <span className="font-medium text-fuchsia">{win.item}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold tabular-nums text-gold">
          <GemIcon size={11} className="text-gold/90" />
          <span>{win.gems.toLocaleString()}</span>
        </p>
      </div>
    </article>
  );
}

export function SimulatedLiveFeed({
  categoryFilter: _categoryFilter = "all",
  embedded = false,
}: SimulatedLiveFeedProps) {
  const [wins, setWins] = useState<SimulatedWin[]>(() => seedSimulatedWins(8));
  const [newestId, setNewestId] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleNext() {
      const delay =
        SIMULATED_FEED_INTERVAL_MIN_MS +
        Math.random() * (SIMULATED_FEED_INTERVAL_MAX_MS - SIMULATED_FEED_INTERVAL_MIN_MS);

      timeoutId = setTimeout(() => {
        const next = createSimulatedWin();
        setNewestId(next.id);
        setWins((prev) => [next, ...prev].slice(0, SIMULATED_FEED_MAX_WINS));
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!newestId) return;
    const timer = setTimeout(() => setNewestId(null), 420);
    return () => clearTimeout(timer);
  }, [newestId]);

  const marqueeItems = useMemo(() => [...wins, ...wins], [wins]);

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
          <div className="simulated-feed-marquee flex w-max items-center gap-4 pr-4">
            {marqueeItems.map((win, index) => (
              <TickerPullCard
                key={`${win.id}-${index}`}
                win={win}
                isNewest={win.id === newestId && index === 0}
                ariaHidden={index >= wins.length}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
