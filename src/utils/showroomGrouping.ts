import { getPackDropTable } from "../data/packDropTables";
import { ALL_PACK_POKEMON_ITEMS } from "../constants/packPokemonPools";
import type { Card } from "../types";
import type { CatalogPack } from "../types/box";
import type { StoreItem, StoreRarity } from "../types/store";
import { STORE_TIERS } from "../types/store";

export const SHOWROOM_RARITY_ORDER: readonly StoreRarity[] = STORE_TIERS;

const STATIC_ITEM_RARITY = new Map(
  ALL_PACK_POKEMON_ITEMS.map((item) => [item.id, item.rarity] as const),
);

const TIER_RANK = Object.fromEntries(
  STORE_TIERS.map((tier, index) => [tier, index]),
) as Record<StoreRarity, number>;

function isStoreRarity(value: string): value is StoreRarity {
  return (STORE_TIERS as readonly string[]).includes(value);
}

/** Rarest tier wins when the same card id appears in multiple pools. */
function assignTier(map: Map<string, StoreRarity>, id: string, tier: StoreRarity): void {
  const existing = map.get(id);
  if (!existing || TIER_RANK[tier] < TIER_RANK[existing]) {
    map.set(id, tier);
  }
}

/**
 * Three-layer store-rarity map: drop tables → remote store items → static catalog.
 */
export function buildStoreRarityByCardId(
  packs: readonly CatalogPack[],
  storeItemsByPackId: Record<string, StoreItem[]>,
): Map<string, StoreRarity> {
  const map = new Map<string, StoreRarity>();

  for (const pack of packs) {
    for (const entry of getPackDropTable(pack.id)) {
      assignTier(map, entry.card.id, entry.storeRarity);
    }
    for (const item of storeItemsByPackId[pack.id] ?? []) {
      assignTier(map, item.id, item.rarity);
    }
  }

  for (const [id, tier] of STATIC_ITEM_RARITY) {
    if (!map.has(id)) {
      map.set(id, tier);
    }
  }

  return map;
}

function appRarityFallback(card: Card): StoreRarity {
  if (card.rarity === "Ancient Rare") return "Mythic";
  if (card.rarity === "Rare") return "Rare";
  return "Common";
}

export function resolveStoreRarity(
  card: Card,
  storeRarityByCardId: Map<string, StoreRarity>,
): StoreRarity {
  const fromMap = storeRarityByCardId.get(card.id);
  if (fromMap) return fromMap;

  if (import.meta.env.DEV) {
    console.warn(`[showroom] No store rarity for card id "${card.id}" — using app-rarity fallback.`);
  }

  return appRarityFallback(card);
}

export type ShowroomRarityRows = Record<StoreRarity, Card[]>;

export function groupCardsByStoreRarity(
  cards: readonly Card[],
  storeRarityByCardId: Map<string, StoreRarity>,
): ShowroomRarityRows {
  const rows = Object.fromEntries(
    STORE_TIERS.map((tier) => [tier, [] as Card[]]),
  ) as ShowroomRarityRows;

  for (const card of cards) {
    const tier = resolveStoreRarity(card, storeRarityByCardId);
    if (!isStoreRarity(tier)) continue;
    rows[tier].push(card);
  }

  for (const tier of STORE_TIERS) {
    rows[tier].sort((a, b) => b.value - a.value);
  }

  return rows;
}
