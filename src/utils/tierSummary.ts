import type { StoreItem, StoreRarity } from "../types/store";
import { STORE_TIERS } from "../types/store";
import { formatProbability } from "../data/packDropTables";

export interface TierSummaryRow {
  tier: StoreRarity;
  showcase: StoreItem | null;
  /** Representative cards shown in the gallery (up to `examplesPerTier`). */
  examples: StoreItem[];
  /** Tier share of this pack's pool, normalized to 100%. */
  totalProbability: number;
  cardCount: number;
  formattedChance: string;
  inPool: boolean;
}

export function buildTierSummaries(
  items: StoreItem[],
  examplesPerTier = 2,
): TierSummaryRow[] {
  const poolTotal = items.reduce((sum, item) => sum + item.probability, 0);
  const scale = poolTotal > 0 ? 100 / poolTotal : 0;

  return STORE_TIERS.map((tier) => {
    const inTier = items.filter((item) => item.rarity === tier);
    const sorted = [...inTier].sort((a, b) => b.value - a.value);
    const rawProb = inTier.reduce((sum, item) => sum + item.probability, 0);
    const totalProbability = rawProb * scale;

    return {
      tier,
      showcase: sorted[0] ?? null,
      examples: sorted.slice(0, examplesPerTier),
      totalProbability,
      cardCount: inTier.length,
      formattedChance: formatProbability(totalProbability),
      inPool: inTier.length > 0,
    };
  });
}
