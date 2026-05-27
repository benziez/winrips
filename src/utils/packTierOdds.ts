import type { StoreRarity } from "../types/store";
import { getPackDropTable } from "../data/packDropTables";
import { formatUsd, gemsToUsd } from "../constants/retail";

export const PACK_TIER_ORDER: StoreRarity[] = [
  "Common",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

export const PACK_TIER_BAR_GRADIENT: Record<StoreRarity, string> = {
  Common: "linear-gradient(90deg, #4A4A4A 0%, #B0B0B0 100%)",
  Rare: "linear-gradient(90deg, #1E40AF 0%, #3B82F6 100%)",
  Epic: "linear-gradient(90deg, #6B21A8 0%, #A855F7 100%)",
  Legendary: "linear-gradient(90deg, #991B1B 0%, #EF4444 100%)",
  Mythic: "linear-gradient(90deg, #CA8A04 0%, #FBBF24 100%)",
};

const FALLBACK_PRICE_BANDS: Record<StoreRarity, string> = {
  Common: "$0.1–$1",
  Rare: "$1–$2",
  Epic: "$2–$3",
  Legendary: "$3–$4",
  Mythic: "$4–$20",
};

export interface PackTierOddsRow {
  tier: StoreRarity;
  probability: number;
  priceRange: string;
}

function formatPriceBand(minGems: number, maxGems: number): string {
  const min = formatUsd(gemsToUsd(minGems));
  const max = formatUsd(gemsToUsd(maxGems));
  if (min === max) return min;
  return `${min}–${max}`;
}

export function getPackTierOdds(packId: string): PackTierOddsRow[] {
  const table = getPackDropTable(packId);
  const byTier = new Map<StoreRarity, { probability: number; minGems: number; maxGems: number }>();

  for (const tier of PACK_TIER_ORDER) {
    byTier.set(tier, { probability: 0, minGems: Number.POSITIVE_INFINITY, maxGems: 0 });
  }

  for (const entry of table) {
    const tier = entry.storeRarity;
    const bucket = byTier.get(tier);
    if (!bucket) continue;
    bucket.probability += entry.probability;
    bucket.minGems = Math.min(bucket.minGems, entry.card.value);
    bucket.maxGems = Math.max(bucket.maxGems, entry.card.value);
  }

  return PACK_TIER_ORDER.map((tier) => {
    const bucket = byTier.get(tier)!;
    const hasCards = bucket.minGems !== Number.POSITIVE_INFINITY;
    return {
      tier,
      probability: bucket.probability,
      priceRange: hasCards
        ? formatPriceBand(bucket.minGems, bucket.maxGems)
        : FALLBACK_PRICE_BANDS[tier],
    };
  });
}

export function formatTierProbability(p: number): string {
  return `${p.toFixed(1)}%`;
}
