import type { Card } from "../types";
import { getPackStoreItems, storeItemToCard } from "../constants/catalog";
import type { StoreItem } from "../types/store";
import { LOBBY_PACK_CATALOG } from "../constants/packs";
import { normalizePackWeights } from "../utils/packProbability";

export interface PackDropEntry {
  card: Card;
  storeRarity: StoreItem["rarity"];
  /** Display probability in percent, e.g. 0.2 for Ancient Rare */
  probability: number;
}

function buildDropTableFromStoreItems(items: StoreItem[]): PackDropEntry[] {
  if (items.length === 0) return [];

  const weights = normalizePackWeights(items);

  return items.map((item, index) => ({
    card: storeItemToCard(item),
    storeRarity: item.rarity,
    probability: weights[index] ?? 0,
  }));
}

function dropTableForPack(packId: string): PackDropEntry[] {
  const pack = LOBBY_PACK_CATALOG.find((p) => p.id === packId);
  if (!pack) return [];

  const items = getPackStoreItems(pack);
  return buildDropTableFromStoreItems(items);
}

/** Per-pack drop tables — probabilities sum to 100% per pack */
export const PACK_DROP_TABLES: Record<string, PackDropEntry[]> = Object.fromEntries(
  LOBBY_PACK_CATALOG.map((pack) => [pack.id, dropTableForPack(pack.id)]),
);

export function getPackDropTable(packId: string): PackDropEntry[] {
  return PACK_DROP_TABLES[packId] ?? [];
}

export function formatProbability(p: number): string {
  if (p >= 1) return `${p.toFixed(p % 1 === 0 ? 0 : 1)}%`;
  if (p >= 0.1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(2)}%`;
}
