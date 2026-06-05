import { INFINITE_SERIES_TIER_ODDS } from "../../../constants/infiniteSeriesPools";
import { formatTierProbability } from "../../../utils/packTierOdds";

const INFINITE_TIER_BAR_GRADIENT: Record<(typeof INFINITE_SERIES_TIER_ODDS)[number]["label"], string> = {
  Floor: "linear-gradient(90deg, #4A4A4A 0%, #B0B0B0 100%)",
  "Mid-Tier": "linear-gradient(90deg, #6B21A8 0%, #A855F7 100%)",
  Grail: "linear-gradient(90deg, #CA8A04 0%, #FBBF24 100%)",
};

/** Infinite Series tier odds — 77% floor / 18% mid / 5% grail across all four packs. */
export function PackOddsDisplay() {
  const maxProbability = Math.max(
    ...INFINITE_SERIES_TIER_ODDS.map((row) => row.probability),
    1,
  );

  return (
    <div className="relative mt-8 border-l border-[var(--rip-border)] pl-4">
      {INFINITE_SERIES_TIER_ODDS.map((row) => {
        const widthPct = Math.max(4, (row.probability / maxProbability) * 100);
        const labelInside = widthPct >= 28;
        return (
          <div
            key={row.label}
            className="mb-4 grid grid-cols-[5.5rem_1fr] items-center gap-3 last:mb-0"
          >
            <div className="text-right">
              <p className="text-[14px] font-bold text-white">{row.label}</p>
            </div>
            <div className="relative h-8 w-full overflow-hidden rounded-md bg-[var(--rip-surface)]">
              <div
                className="absolute inset-y-0 left-0 flex items-center rounded-md px-2"
                style={{
                  width: `${widthPct}%`,
                  background: INFINITE_TIER_BAR_GRADIENT[row.label],
                }}
              >
                {labelInside ? (
                  <span className="ml-auto text-[16px] font-bold text-white">
                    {formatTierProbability(row.probability)}
                  </span>
                ) : null}
              </div>
              {!labelInside ? (
                <span
                  className="absolute top-1/2 -translate-y-1/2 text-[16px] font-bold text-white"
                  style={{ left: `calc(${widthPct}% + 6px)` }}
                >
                  {formatTierProbability(row.probability)}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
