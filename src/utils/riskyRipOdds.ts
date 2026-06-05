import type { StoreRarity } from "../types/store";
import { normalizePackWeights } from "./packProbability";

export type OddsMode = "normal" | "risky_rip";

/** Tier multipliers applied at roll time for Risky Rip mode (base weights unchanged). */
export const RISKY_RIP_TIER_MULTIPLIERS: Record<StoreRarity, number> = {
  Common: 2.0,
  Rare: 0.3,
  Epic: 0.3,
  Legendary: 2.0,
  Mythic: 2.0,
};

export function riskyRipMultiplierForRarity(rarity: StoreRarity): number {
  return RISKY_RIP_TIER_MULTIPLIERS[rarity] ?? 1;
}

/** Apply Risky Rip tier multipliers and renormalize probabilities to 100%. */
export function applyRiskyRipMultipliers<T extends { probability: number; rarity: StoreRarity }>(
  items: readonly T[],
): T[] {
  if (items.length === 0) return [];

  const scaled = items.map(
    (item) => item.probability * riskyRipMultiplierForRarity(item.rarity),
  );
  let probabilities = normalizePackWeights(scaled.map((probability) => ({ probability })));
  probabilities = applyRiskyRipTierFloors(items, probabilities);

  return items.map((item, index) => ({
    ...item,
    probability: probabilities[index] ?? 0,
  }));
}

const RISKY_RIP_MIN_TIER_PCT = 0.1;

/** Ensures tiers with pool cards never display as 0.0% after risky-rip weighting. */
function applyRiskyRipTierFloors<T extends { rarity: StoreRarity }>(
  items: readonly T[],
  probabilities: number[],
): number[] {
  const tierIndices = new Map<StoreRarity, number[]>();

  for (let i = 0; i < items.length; i++) {
    const rarity = items[i]!.rarity;
    const bucket = tierIndices.get(rarity);
    if (bucket) bucket.push(i);
    else tierIndices.set(rarity, [i]);
  }

  const adjusted = [...probabilities];

  for (const indices of tierIndices.values()) {
    const tierSum = indices.reduce((sum, index) => sum + adjusted[index]!, 0);
    if (tierSum <= 0 || tierSum >= RISKY_RIP_MIN_TIER_PCT) continue;

    const scale = RISKY_RIP_MIN_TIER_PCT / tierSum;
    for (const index of indices) {
      adjusted[index] = adjusted[index]! * scale;
    }
  }

  return normalizePackWeights(adjusted.map((probability) => ({ probability })));
}

export function isRiskyRipMode(mode: string): boolean {
  return mode === "risky_rip";
}
