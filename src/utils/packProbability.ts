import type { StoreItem } from "../types/store";
import { isFloorFillerItemId } from "../constants/floorFillers";
import { isInfiniteSeriesPackId } from "../constants/infiniteSeriesPools";
import { normalizePackId } from "../constants/packIdAliases";

/** Percent scale for pack odds — all weights normalize to this total. */
export const PROBABILITY_TOTAL = 100;

/** Packs whose defineItem() probability seeds drive base weights (not inverse gem value). */
const PACKS_USING_SEED_WEIGHTS = new Set(["trainers-starter"]);

/** Legacy default when a pack has no explicit target (10–12% band). */
export const HOUSE_EDGE_MIN = 0.1;
export const HOUSE_EDGE_MAX = 0.12;

/** Fallback calibration target when no per-pack override exists. */
export const TARGET_HOUSE_EDGE = 0.12;

/** ± tolerance (probability points) around each pack's target house edge during calibration. */
export const HOUSE_EDGE_CALIBRATION_TOLERANCE = 0.005;

/** Per-pack house edge targets — player EV = spinCost × (1 − edge). */
export const PACK_TARGET_HOUSE_EDGE: Record<string, number> = {
  /** $1 pack → ~$0.40 EV after payment processing fees (60% house edge). */
  "trainers-starter": 0.6,
  "mega-evolution": 0.2,
  "shiny-vault": 0.2,
  "151-booster-collector": 0.2,
  "151-booster": 0.2,
  "legendary-hunt": 0.22,
  "waifu-vault": 0.22,
  "prismatic-sir": 0.25,
  "psa-10-chaser": 0.25,
  "evolving-skies": 0.25,
  "obsidian-vault": 0.28,
  "god-pack-1999": 0.28,
  "1999-god": 0.28,
  "wotc-first-edition": 0.3,
  "infinite-prime": 0.12,
  "infinite-apex": 0.12,
  "infinite-zenith": 0.12,
  "infinite-omega": 0.12,
};

export function packHouseEdgeTarget(packId: string): number {
  const normalized = normalizePackId(packId.trim());
  return PACK_TARGET_HOUSE_EDGE[normalized] ?? TARGET_HOUSE_EDGE;
}

/** Inverse-power raw weight — expensive cards approach micro-odds. */
export const GEM_VALUE_SCALING_EXPONENT = 2.35;

/** Target combined hit rate for floor filler commons before EV calibration. */
export const FLOOR_FILLER_TARGET_SHARE = 0.85;

/** Maximum displayed/roll probability for top jackpot grails (percent). */
export const GRAIL_MAX_PROBABILITY = 0.06;

/** Minimum cap for ultra-rare grails (percent). */
export const GRAIL_MIN_PROBABILITY = 0.01;

/** Hard ceiling for any single grail row (percent). */
export const GRAIL_ABSOLUTE_MAX = 0.5;

/** Share of target EV budget reserved for the grail tier collectively. */
export const GRAIL_EV_BUDGET_SHARE = 0.18;

/** Probability mass moved per calibration iteration (percent points). */
const EV_TRANSFER_STEP = 0.25;

export interface HouseEdgeOptions {
  spinCost: number;
  /** Per-pack house edge target (defaults to packHouseEdgeTarget when packId set, else TARGET_HOUSE_EDGE). */
  houseEdge?: number;
  /** Pack id — resolves houseEdge from PACK_TARGET_HOUSE_EDGE when houseEdge omitted. */
  packId?: string;
  /** Per-pack floor mass target override (defaults to FLOOR_FILLER_TARGET_SHARE). */
  floorShare?: number;
  /** Per-pack grail probability cap override (defaults to grailAbsoluteMaxForPack). */
  grailMaxProbability?: number;
  /** Per-pack grail probability floor override (defaults to GRAIL_MIN_PROBABILITY). */
  grailMinProbability?: number;
}

export interface ProbabilityWeighted {
  value: number;
  probability: number;
}

export function expectedValueBounds(
  spinCost: number,
  houseEdge?: number,
): { min: number; max: number } {
  const edge = houseEdge ?? TARGET_HOUSE_EDGE;
  const tol = HOUSE_EDGE_CALIBRATION_TOLERANCE;
  return {
    min: spinCost * (1 - edge - tol),
    max: spinCost * (1 - edge + tol),
  };
}

export function targetPackExpectedValue(
  spinCost: number,
  edge: number = TARGET_HOUSE_EDGE,
): number {
  return spinCost * (1 - edge);
}

export function computePackExpectedValue(items: readonly ProbabilityWeighted[]): number {
  return items.reduce(
    (sum, item) => sum + (item.probability / PROBABILITY_TOTAL) * item.value,
    0,
  );
}

/** Inverse-power raw weight — expensive cards approach micro-odds. */
export function rawWeightFromGemValue(
  gemValue: number,
  scalingFactor: number = GEM_VALUE_SCALING_EXPONENT,
): number {
  const safeValue = Math.max(gemValue, 1);
  return 1 / Math.pow(safeValue, scalingFactor);
}

export function isFloorFillerStoreItem(item: Pick<StoreItem, "id">): boolean {
  return isFloorFillerItemId(item.id);
}

export function isGrailStoreItem(item: StoreItem, spinCost: number): boolean {
  if (item.rarity === "Mythic" || item.rarity === "Legendary") return true;
  return item.value >= Math.max(spinCost * 2, 5_000);
}

/** Per-grail cap scales with box cost so premium pools can still hit target EV. */
export function grailAbsoluteMaxForPack(spinCost: number): number {
  if (spinCost >= 25_000) return 3.5;
  if (spinCost >= 10_000) return 2.5;
  if (spinCost >= 4_000) return 1.8;
  if (spinCost >= 2_500) return 1.4;
  if (spinCost >= 1_000) return 1.2;
  return GRAIL_MAX_PROBABILITY;
}

export function grailMaxProbabilityForItem(
  item: StoreItem,
  spinCost: number,
  grailMax?: number,
  houseEdge?: number,
): number {
  if (!isGrailStoreItem(item, spinCost)) return PROBABILITY_TOTAL;

  // Explicit per-pack override is the authored ceiling (starter / tuned chase packs).
  if (grailMax != null) return grailMax;

  const targetEv = targetPackExpectedValue(spinCost, houseEdge);
  const grailBudget = targetEv * GRAIL_EV_BUDGET_SHARE;
  const soloCap = (grailBudget / Math.max(item.value, 1)) * PROBABILITY_TOTAL;

  return Math.min(
    Math.max(soloCap, GRAIL_MIN_PROBABILITY),
    grailAbsoluteMaxForPack(spinCost),
  );
}

/**
 * Normalize raw weights (any positive sum) to exactly 100%.
 * Rounding drift is applied to the last entry.
 */
export function normalizePackWeights(items: readonly { probability: number }[]): number[] {
  if (items.length === 0) return [];

  const rawTotal = items.reduce((sum, item) => sum + item.probability, 0);
  if (rawTotal <= 0) {
    const even = PROBABILITY_TOTAL / items.length;
    return items.map(() => even);
  }

  const scale = PROBABILITY_TOTAL / rawTotal;
  const weights = items.map((item) => item.probability * scale);
  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  const drift = PROBABILITY_TOTAL - sum;

  if (items.length > 0 && Math.abs(drift) > 1e-9) {
    weights[weights.length - 1] += drift;
  }

  return weights;
}

function boostFloorFillerWeights(
  items: readonly StoreItem[],
  rawWeights: number[],
  floorShare: number = FLOOR_FILLER_TARGET_SHARE,
): number[] {
  const floorIndexes: number[] = [];
  let rawFloor = 0;
  let rawNonFloor = 0;

  for (let i = 0; i < items.length; i++) {
    if (isFloorFillerStoreItem(items[i]!)) {
      floorIndexes.push(i);
      rawFloor += rawWeights[i]!;
    } else {
      rawNonFloor += rawWeights[i]!;
    }
  }

  if (floorIndexes.length === 0 || rawFloor <= 0) return rawWeights;

  const targetFloor = Math.min(Math.max(floorShare, 0.2), 0.92);
  const targetNonFloor = 1 - targetFloor;
  const floorBoost =
    rawNonFloor > 0
      ? (targetFloor * rawNonFloor) / (targetNonFloor * rawFloor)
      : targetFloor / rawFloor;

  return rawWeights.map((weight, index) =>
    floorIndexes.includes(index) ? weight * floorBoost : weight,
  );
}

function capGrailProbabilities(
  items: readonly StoreItem[],
  weights: number[],
  spinCost: number,
  grailMax?: number,
  grailMin?: number,
  houseEdge?: number,
): number[] {
  const minProb = grailMin ?? GRAIL_MIN_PROBABILITY;
  return weights.map((weight, index) => {
    const item = items[index]!;
    if (!isGrailStoreItem(item, spinCost)) return weight;
    const cap = grailMaxProbabilityForItem(item, spinCost, grailMax, houseEdge);
    return Math.min(Math.max(weight, minProb), cap);
  });
}

function assignProbabilities<T extends StoreItem>(
  items: readonly T[],
  weights: number[],
): T[] {
  const normalized = normalizePackWeights(weights.map((probability) => ({ probability })));
  return items.map((item, index) => ({
    ...item,
    probability: normalized[index] ?? 0,
  }));
}

function stagePackWeights<T extends StoreItem>(
  items: readonly T[],
  weights: number[],
  spinCost: number,
  grailMax?: number,
  grailMin?: number,
  houseEdge?: number,
): T[] {
  let capped = capGrailProbabilities(items, weights, spinCost, grailMax, grailMin, houseEdge);
  let staged = assignProbabilities(items, capped);
  capped = capGrailProbabilities(
    items,
    staged.map((item) => item.probability),
    spinCost,
    grailMax,
    grailMin,
    houseEdge,
  );
  return assignProbabilities(items, capped);
}

function buildBaseWeights<T extends StoreItem>(
  items: readonly T[],
  floorShare: number = FLOOR_FILLER_TARGET_SHARE,
  packId?: string,
): number[] {
  const normalizedPackId = packId ? normalizePackId(packId) : "";
  const useSeed =
    normalizedPackId.length > 0 && PACKS_USING_SEED_WEIGHTS.has(normalizedPackId);
  const raw = items.map((item) =>
    useSeed && item.probability > 0
      ? item.probability
      : rawWeightFromGemValue(item.value),
  );
  const boosted = boostFloorFillerWeights(items, raw, floorShare);
  return normalizePackWeights(boosted.map((probability) => ({ probability })));
}

function floorIndexes(items: readonly StoreItem[]): number[] {
  return items
    .map((item, index) => (isFloorFillerStoreItem(item) ? index : -1))
    .filter((index) => index >= 0);
}

/** Mid-tier chase cards that lift EV without exposing grail jackpots. */
function midTierRecipientIndexes(items: readonly StoreItem[], spinCost: number): number[] {
  return items
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        !isFloorFillerStoreItem(item) && !isGrailStoreItem(item, spinCost),
    )
    .sort((a, b) => b.item.value - a.item.value)
    .slice(0, 8)
    .map(({ index }) => index);
}

function grailRecipientIndexes(items: readonly StoreItem[], spinCost: number): number[] {
  return items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isGrailStoreItem(item, spinCost))
    .sort((a, b) => b.item.value - a.item.value)
    .map(({ index }) => index);
}

function grailDonorIndexes(items: readonly StoreItem[], spinCost: number): number[] {
  return grailRecipientIndexes(items, spinCost);
}

function transferMass(
  weights: number[],
  donorIndexes: number[],
  recipientIndexes: number[],
  amount: number,
  donorMin: number,
): boolean {
  if (donorIndexes.length === 0 || recipientIndexes.length === 0 || amount <= 0) {
    return false;
  }

  const perDonor = amount / donorIndexes.length;
  const available = Math.min(
    ...donorIndexes.map((index) => Math.max(0, weights[index]! - donorMin)),
  );
  const transfer = Math.min(perDonor, available);
  if (transfer <= 1e-9) return false;

  const totalMoved = transfer * donorIndexes.length;
  const perRecipient = totalMoved / recipientIndexes.length;

  donorIndexes.forEach((index) => {
    weights[index]! -= transfer;
  });
  recipientIndexes.forEach((index) => {
    weights[index]! += perRecipient;
  });

  return true;
}

/**
 * Iteratively shifts probability mass between floor, mid-tier, and grail rows
 * until pack EV sits within the per-pack house-edge tolerance band.
 */
function calibrateHouseEdge<T extends StoreItem>(
  items: readonly T[],
  spinCost: number,
  floorShare: number = FLOOR_FILLER_TARGET_SHARE,
  grailMax?: number,
  grailMin?: number,
  houseEdge?: number,
  packId?: string,
): T[] {
  if (spinCost <= 0 || items.length === 0) return [...items];

  const { min, max } = expectedValueBounds(spinCost, houseEdge);
  const grailDonorMin = grailMin ?? GRAIL_MIN_PROBABILITY;

  let weights = buildBaseWeights(items, floorShare, packId);
  let staged = stagePackWeights(items, weights, spinCost, grailMax, grailMin, houseEdge);

  for (let iteration = 0; iteration < 1200; iteration++) {
    const ev = computePackExpectedValue(staged);
    if (ev >= min && ev <= max) {
      return staged;
    }

    const floors = floorIndexes(items);
    const mids = midTierRecipientIndexes(items, spinCost);

    if (ev < min) {
      const grailRecipients = grailRecipientIndexes(items, spinCost);
      if (
        !transferMass(weights, floors, mids, EV_TRANSFER_STEP, 0.35) &&
        !transferMass(weights, floors, grailRecipients, EV_TRANSFER_STEP, 0.35) &&
        !transferMass(weights, mids, grailRecipients, EV_TRANSFER_STEP * 0.75, 0.25)
      ) {
        break;
      }
    } else {
      const premiumDonors = grailDonorIndexes(items, spinCost);
      const donors =
        premiumDonors.length > 0
          ? premiumDonors
          : mids.filter((index) => weights[index]! > 0.5);
      if (!transferMass(weights, donors, floors, EV_TRANSFER_STEP, grailDonorMin)) {
        break;
      }
    }

    staged = stagePackWeights(items, weights, spinCost, grailMax, grailMin, houseEdge);
  }

  return tunePremiumTailScale(items, weights, spinCost, grailMax, grailMin, houseEdge);
}

function upscalePremiumTail<T extends StoreItem>(
  items: readonly T[],
  weights: number[],
  spinCost: number,
  factor: number,
  grailMax?: number,
  grailMin?: number,
  houseEdge?: number,
): T[] {
  const scaled = weights.map((weight, index) =>
    isFloorFillerStoreItem(items[index]!) ? weight : weight * factor,
  );
  return stagePackWeights(items, scaled, spinCost, grailMax, grailMin, houseEdge);
}

function tunePremiumTailScale<T extends StoreItem>(
  items: readonly T[],
  weights: number[],
  spinCost: number,
  grailMax?: number,
  grailMin?: number,
  houseEdge?: number,
): T[] {
  const { min, max } = expectedValueBounds(spinCost, houseEdge);
  const targetEv = targetPackExpectedValue(spinCost, houseEdge);
  let lo = 0.5;
  let hi =
    spinCost >= 25_000
      ? 200
      : spinCost >= 10_000
        ? 120
        : spinCost >= 4_000
          ? 80
          : spinCost >= 1_000
            ? 48
            : 16;
  let best = stagePackWeights(items, weights, spinCost, grailMax, grailMin, houseEdge);
  let bestDistance = Math.abs(computePackExpectedValue(best) - targetEv);

  for (let i = 0; i < 48; i++) {
    const factor = (lo + hi) / 2;
    const candidate = upscalePremiumTail(
      items,
      weights,
      spinCost,
      factor,
      grailMax,
      grailMin,
      houseEdge,
    );
    const ev = computePackExpectedValue(candidate);
    const distance = Math.abs(ev - targetEv);

    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }

    if (ev >= min && ev <= max) {
      return candidate;
    }

    if (ev < min) {
      lo = factor;
    } else {
      hi = factor;
    }
  }

  return best;
}

/**
 * Value-scaled house-edge odds: inverse-power weights, floor mass, grail caps,
 * then EV calibration to each pack's target house edge.
 */
export function applyValueScaledProbabilities<T extends StoreItem>(
  items: readonly T[],
  options?: HouseEdgeOptions,
): T[] {
  if (items.length === 0) return [];

  const packId = options?.packId?.trim() ?? "";
  if (packId && isInfiniteSeriesPackId(packId)) {
    const weights = items.map((item) => (item.probability > 0 ? item.probability : 0));
    return assignProbabilities([...items], weights);
  }

  const spinCost = options?.spinCost ?? 0;
  const houseEdge =
    options?.houseEdge ??
    (options?.packId ? packHouseEdgeTarget(options.packId) : TARGET_HOUSE_EDGE);
  const floorShare = options?.floorShare ?? FLOOR_FILLER_TARGET_SHARE;
  const grailMax = options?.grailMaxProbability;
  const grailMin = options?.grailMinProbability;
  if (spinCost <= 0) {
    return stagePackWeights(
      items,
      buildBaseWeights(items, floorShare, options?.packId),
      0,
      grailMax,
      grailMin,
      houseEdge,
    );
  }

  return calibrateHouseEdge(
    items,
    spinCost,
    floorShare,
    grailMax,
    grailMin,
    houseEdge,
    options?.packId,
  );
}
