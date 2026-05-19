import type { Pack, PackCategory } from "../types";
import type { StoreItem } from "../types/store";
import { MOCK_ITEMS, storeItemToCard } from "./items";

export { MOCK_ITEMS, storeItemToCard } from "./items";

function belongsToCategory(item: StoreItem, category: PackCategory): boolean {
  if (category === "pokemon") {
    return item.id.startsWith("pk-");
  }
  return item.setId === category;
}

export function getCategoryPool(category: PackCategory): StoreItem[] {
  return (MOCK_ITEMS[category] ?? []).filter((item) => belongsToCategory(item, category));
}

/** Pack pulls only from whitelisted IDs in the same category — never bleeds across sports/TCG. */
export function getPackStoreItems(pack: Pack): StoreItem[] {
  const pool = getCategoryPool(pack.category);
  if (pool.length === 0) return [];

  if (!pack.items || pack.items.length === 0) {
    return [];
  }

  const allowed = new Set(pack.items);
  return pool.filter((item) => allowed.has(item.id) && belongsToCategory(item, pack.category));
}

export function getPackStoreItemsById(packId: string, packs: Pack[]): StoreItem[] {
  const pack = packs.find((p) => p.id === packId);
  if (!pack) return [];
  return getPackStoreItems(pack);
}

export function cardPoolForCategory(category: PackCategory) {
  return getCategoryPool(category).map(storeItemToCard);
}
