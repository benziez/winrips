import type { Rarity } from "../types";
import type { StoreItem, StoreRarity } from "../types/store";
import {
  EVOLVING_SKIES_POOL,
  GOD_PACK_1999_POOL,
  LEGENDARY_HUNT_POOL,
  MIDNIGHT_GRAIL_POOL,
  POWER_HOUR_POOL,
  PSA_10_CHASER_POOL,
  WEEKEND_WARRIOR_POOL,
  WOTC_FIRST_EDITION_POOL,
} from "./packPokemonPools";

/** 77% floor / 18% mid / 5% grail — equal weight within each tier (30 cards total). */
export const INFINITE_FLOOR_SLOT_COUNT = 23;
export const INFINITE_MID_SLOT_COUNT = 5;
export const INFINITE_GRAIL_SLOT_COUNT = 2;
export const INFINITE_TOTAL_SLOT_COUNT =
  INFINITE_FLOOR_SLOT_COUNT + INFINITE_MID_SLOT_COUNT + INFINITE_GRAIL_SLOT_COUNT;

export const INFINITE_FLOOR_TIER_PERCENT = 77;
export const INFINITE_MID_TIER_PERCENT = 18;
export const INFINITE_GRAIL_TIER_PERCENT = 5;

export const INFINITE_FLOOR_SLOT_PROB = INFINITE_FLOOR_TIER_PERCENT / INFINITE_FLOOR_SLOT_COUNT;
export const INFINITE_MID_SLOT_PROB = INFINITE_MID_TIER_PERCENT / INFINITE_MID_SLOT_COUNT;
export const INFINITE_GRAIL_SLOT_PROB = INFINITE_GRAIL_TIER_PERCENT / INFINITE_GRAIL_SLOT_COUNT;

export const INFINITE_SERIES_TIER_ODDS = [
  { label: "Floor", probability: INFINITE_FLOOR_TIER_PERCENT },
  { label: "Mid-Tier", probability: INFINITE_MID_TIER_PERCENT },
  { label: "Grail", probability: INFINITE_GRAIL_TIER_PERCENT },
] as const;

export const INFINITE_SERIES_PACK_IDS = [
  "infinite-prime",
  "infinite-apex",
  "infinite-zenith",
  "infinite-omega",
] as const;

export type InfiniteSeriesPackId = (typeof INFINITE_SERIES_PACK_IDS)[number];

const INFINITE_SERIES_PACK_ID_SET = new Set<string>(INFINITE_SERIES_PACK_IDS);

export function isInfiniteSeriesPackId(packId: string): packId is InfiniteSeriesPackId {
  return INFINITE_SERIES_PACK_ID_SET.has(packId.trim());
}

interface PoolBuildConfig {
  prefix: string;
  spinCostGems: number;
  floorSources: StoreItem[];
  midSources: StoreItem[];
  grailSources: StoreItem[];
  valueScale: number;
}

function remapTier(
  sources: StoreItem[],
  prefix: string,
  slotOffset: number,
  tier: "floor" | "mid" | "grail",
  probability: number,
  spinCostGems: number,
  valueScale: number,
): StoreItem[] {
  const tierFloorRatio =
    tier === "floor" ? 0.12 : tier === "mid" ? 0.42 : 2.4;
  const tierCeilingRatio =
    tier === "floor" ? 0.28 : tier === "mid" ? 0.78 : 8.5;

  return sources.map((source, index) => {
    const slot = slotOffset + index + 1;
    const normalizedValue = Math.max(
      500,
      Math.round(
        spinCostGems *
          (tierFloorRatio +
            ((tierCeilingRatio - tierFloorRatio) * index) /
              Math.max(1, sources.length - 1)) *
          valueScale,
      ),
    );

    return {
      ...source,
      id: `${prefix}-${String(slot).padStart(2, "0")}`,
      value: normalizedValue,
      probability,
      tcgMarketUsd: Math.max(0.5, +(normalizedValue / 100).toFixed(2)),
      rarity:
        tier === "grail"
          ? ("Mythic" as StoreRarity)
          : tier === "mid"
            ? ("Epic" as StoreRarity)
            : ((index < 12 ? "Common" : "Rare") as StoreRarity),
      appRarity:
        tier === "grail"
          ? ("Ancient Rare" as Rarity)
          : tier === "mid"
            ? ("Rare" as Rarity)
            : ((index < 12 ? "Common" : "Rare") as Rarity),
    };
  });
}

function buildInfinitePool(config: PoolBuildConfig): StoreItem[] {
  const floor = remapTier(
    config.floorSources,
    config.prefix,
    0,
    "floor",
    INFINITE_FLOOR_SLOT_PROB,
    config.spinCostGems,
    config.valueScale,
  );
  const mid = remapTier(
    config.midSources,
    config.prefix,
    floor.length,
    "mid",
    INFINITE_MID_SLOT_PROB,
    config.spinCostGems,
    config.valueScale,
  );
  const grail = remapTier(
    config.grailSources,
    config.prefix,
    floor.length + mid.length,
    "grail",
    INFINITE_GRAIL_SLOT_PROB,
    config.spinCostGems,
    config.valueScale,
  );

  return [...floor, ...mid, ...grail];
}

function assertInfinitePool(pool: StoreItem[], packLabel: string): void {
  if (pool.length !== INFINITE_TOTAL_SLOT_COUNT) {
    throw new Error(
      `[infiniteSeriesPools] ${packLabel}: expected ${INFINITE_TOTAL_SLOT_COUNT} cards, got ${pool.length}`,
    );
  }

  const ids = new Set(pool.map((item) => item.id));
  if (ids.size !== pool.length) {
    throw new Error(`[infiniteSeriesPools] ${packLabel}: duplicate card IDs in pool`);
  }

  const probabilitySum = pool.reduce((sum, item) => sum + item.probability, 0);
  if (Math.abs(probabilitySum - 100) > 0.001) {
    throw new Error(
      `[infiniteSeriesPools] ${packLabel}: probabilities sum to ${probabilitySum}, expected 100`,
    );
  }

  const floorCount = pool.filter((item) => item.probability === INFINITE_FLOOR_SLOT_PROB).length;
  const midCount = pool.filter((item) => item.probability === INFINITE_MID_SLOT_PROB).length;
  const grailCount = pool.filter((item) => item.probability === INFINITE_GRAIL_SLOT_PROB).length;

  if (
    floorCount !== INFINITE_FLOOR_SLOT_COUNT ||
    midCount !== INFINITE_MID_SLOT_COUNT ||
    grailCount !== INFINITE_GRAIL_SLOT_COUNT
  ) {
    throw new Error(
      `[infiniteSeriesPools] ${packLabel}: tier slot mismatch (floor ${floorCount}, mid ${midCount}, grail ${grailCount})`,
    );
  }
}

const PRIME_FLOOR = POWER_HOUR_POOL.slice(0, INFINITE_FLOOR_SLOT_COUNT);
const PRIME_MID = WEEKEND_WARRIOR_POOL.slice(10, 10 + INFINITE_MID_SLOT_COUNT);
const PRIME_GRAIL = LEGENDARY_HUNT_POOL.slice(0, INFINITE_GRAIL_SLOT_COUNT);

const APEX_FLOOR = MIDNIGHT_GRAIL_POOL.slice(0, INFINITE_FLOOR_SLOT_COUNT);
const APEX_MID = PSA_10_CHASER_POOL.slice(0, INFINITE_MID_SLOT_COUNT);
const APEX_GRAIL = LEGENDARY_HUNT_POOL.slice(3, 3 + INFINITE_GRAIL_SLOT_COUNT);

const ZENITH_FLOOR = WEEKEND_WARRIOR_POOL.slice(0, INFINITE_FLOOR_SLOT_COUNT);
const ZENITH_MID = GOD_PACK_1999_POOL.slice(0, INFINITE_MID_SLOT_COUNT);
const ZENITH_GRAIL = EVOLVING_SKIES_POOL.slice(0, INFINITE_GRAIL_SLOT_COUNT);

const OMEGA_FLOOR = GOD_PACK_1999_POOL.slice(0, INFINITE_FLOOR_SLOT_COUNT);
const OMEGA_MID = WOTC_FIRST_EDITION_POOL.slice(0, INFINITE_MID_SLOT_COUNT);
const OMEGA_GRAIL = WOTC_FIRST_EDITION_POOL.slice(18, 18 + INFINITE_GRAIL_SLOT_COUNT);

/** Infinite Prime — $500 high-roller entry. */
export const INFINITE_PRIME_POOL: StoreItem[] = buildInfinitePool({
  prefix: "pk-inf-prime",
  spinCostGems: 50_000,
  floorSources: PRIME_FLOOR,
  midSources: PRIME_MID,
  grailSources: PRIME_GRAIL,
  valueScale: 1,
});

/** Infinite Apex — $750 elevated chase floor. */
export const INFINITE_APEX_POOL: StoreItem[] = buildInfinitePool({
  prefix: "pk-inf-apex",
  spinCostGems: 75_000,
  floorSources: APEX_FLOOR,
  midSources: APEX_MID,
  grailSources: APEX_GRAIL,
  valueScale: 1.08,
});

/** Infinite Zenith — $850 apex-tier variance. */
export const INFINITE_ZENITH_POOL: StoreItem[] = buildInfinitePool({
  prefix: "pk-inf-zenith",
  spinCostGems: 85_000,
  floorSources: ZENITH_FLOOR,
  midSources: ZENITH_MID,
  grailSources: ZENITH_GRAIL,
  valueScale: 1.12,
});

/** Infinite Omega — $1,000 flagship grail hunter. */
export const INFINITE_OMEGA_POOL: StoreItem[] = buildInfinitePool({
  prefix: "pk-inf-omega",
  spinCostGems: 100_000,
  floorSources: OMEGA_FLOOR,
  midSources: OMEGA_MID,
  grailSources: OMEGA_GRAIL,
  valueScale: 1.18,
});

for (const [label, pool] of [
  ["Infinite Prime", INFINITE_PRIME_POOL],
  ["Infinite Apex", INFINITE_APEX_POOL],
  ["Infinite Zenith", INFINITE_ZENITH_POOL],
  ["Infinite Omega", INFINITE_OMEGA_POOL],
] as const) {
  assertInfinitePool(pool, label);
}

export const INFINITE_PRIME_ITEM_IDS = INFINITE_PRIME_POOL.map((item) => item.id);
export const INFINITE_APEX_ITEM_IDS = INFINITE_APEX_POOL.map((item) => item.id);
export const INFINITE_ZENITH_ITEM_IDS = INFINITE_ZENITH_POOL.map((item) => item.id);
export const INFINITE_OMEGA_ITEM_IDS = INFINITE_OMEGA_POOL.map((item) => item.id);

export const ALL_INFINITE_SERIES_ITEMS: StoreItem[] = [
  ...INFINITE_PRIME_POOL,
  ...INFINITE_APEX_POOL,
  ...INFINITE_ZENITH_POOL,
  ...INFINITE_OMEGA_POOL,
];
