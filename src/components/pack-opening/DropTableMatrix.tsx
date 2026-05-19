import type { StoreItem } from "../../types/store";
import { formatGems } from "../../constants/retail";
import { CollectibleImage } from "../ui/CollectibleImage";
import { buildTierSummaries } from "../../utils/tierSummary";

interface DropTableMatrixProps {
  storeItems: StoreItem[];
  packName?: string;
}

const TIER_PILL: Record<StoreItem["rarity"], string> = {
  Mythic: "border-gold/40 text-gold bg-gold/5",
  Legendary: "border-fuchsia/40 text-fuchsia bg-fuchsia/5",
  Epic: "border-cyan/30 text-cyan bg-cyan/5",
  Rare: "border-white/20 text-white/90 bg-white/5",
  Common: "border-border text-muted bg-metallic/40",
};

function TierOddsRow({
  tier,
  formattedChance,
  inPool,
  cardCount,
}: {
  tier: StoreItem["rarity"];
  formattedChance: string;
  inPool: boolean;
  cardCount: number;
}) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-neutral-900/80 py-2.5 last:border-0">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${TIER_PILL[tier]}`}
        >
          {tier}
        </span>
        <span className="text-xs font-semibold text-white sm:text-sm">Tier</span>
        {inPool && cardCount > 0 ? (
          <span className="hidden text-[10px] text-slate-500 sm:inline">
            ({cardCount} {cardCount === 1 ? "card" : "cards"})
          </span>
        ) : null}
      </div>
      <span
        className={`shrink-0 text-xs font-bold tabular-nums sm:text-sm ${
          inPool ? "text-white" : "text-slate-600"
        }`}
      >
        {inPool ? `${formattedChance} Chance` : "0% Chance"}
      </span>
    </li>
  );
}

function ExamplePullCard({ item }: { item: StoreItem }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-[#0A0A0C] transition-colors hover:border-fuchsia/25">
      <div className="flex h-[88px] items-center justify-center border-b border-border bg-obsidian p-2 sm:h-[96px]">
        <CollectibleImage
          src={item.image}
          alt={item.name}
          className="h-full w-full max-w-[64px] object-contain"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-2.5 py-2 sm:px-3 sm:py-2.5">
        <span
          className={`w-fit rounded-full border px-1.5 py-px text-[8px] font-bold uppercase tracking-widest ${TIER_PILL[item.rarity]}`}
        >
          {item.rarity}
        </span>
        <p className="text-[10px] font-semibold leading-tight text-white line-clamp-2 sm:text-[11px]">
          {item.name}
        </p>
        <p className="text-[10px] font-bold tabular-nums text-[#FF007F] sm:text-[11px]">
          {formatGems(item.value)}
        </p>
      </div>
    </article>
  );
}

export function DropTableMatrix({ storeItems }: DropTableMatrixProps) {
  const tiers = buildTierSummaries(storeItems, 2);
  const tiersInPool = tiers.filter((row) => row.inPool);

  if (storeItems.length === 0) {
    return (
      <section className="mt-2 rounded-xl border border-dashed border-border bg-[#121318] px-4 py-8 text-center">
        <p className="text-sm text-muted">Drop table loading for this pack…</p>
      </section>
    );
  }

  return (
    <section className="mt-2 space-y-6">
      <header>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia">
          Box Odds
        </p>
        <h2 className="text-lg font-bold text-white sm:text-xl">Tier Drop Rates</h2>
        <p className="mt-1 max-w-lg text-xs text-slate-400">
          Absolute pull rates by rarity tier for this box. Percentages reflect the full card
          pool on the wheel.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-[#121318] px-4 py-3 sm:px-5 sm:py-4">
        <ul className="divide-y divide-neutral-900/80">
          {tiers.map((row) => (
            <TierOddsRow
              key={row.tier}
              tier={row.tier}
              formattedChance={row.formattedChance}
              inPool={row.inPool}
              cardCount={row.cardCount}
            />
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-1 text-base font-bold text-white sm:text-lg">Available Pulls</h3>
        <p className="mb-4 text-xs text-slate-400">
          Representative hits from each tier included in this drop — from ceiling chases to
          floor commons.
        </p>

        <div className="space-y-5">
          {tiersInPool.map((row) => (
            <div key={row.tier}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${TIER_PILL[row.tier]}`}
                  >
                    {row.tier} Tier
                  </span>
                  <span className="text-[11px] font-medium tabular-nums text-slate-500">
                    {row.formattedChance} Chance
                  </span>
                </div>
                <span className="text-[10px] text-slate-600">
                  {row.cardCount} in pool
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {row.examples.map((item) => (
                  <ExamplePullCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
