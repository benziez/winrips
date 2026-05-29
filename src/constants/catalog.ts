import type { Pack, PackCategory } from "../types";
import type { StoreItem } from "../types/store";
import { isCollectiblePokemonStoreItem } from "../lib/pokemonApi";
import { sanitizeStoreItemImage } from "../utils/collectibleFallback";
import {
  createFloorFillerItems,
  getFloorFillersForPackId,
  packFloorShareOverride,
  packGrailMaxOverride,
  packGrailMinOverride,
} from "./floorFillers";
import { applyValueScaledProbabilities } from "../utils/packProbability";
import { MOCK_ITEMS, storeItemToCard } from "./items";

export { MOCK_ITEMS, storeItemToCard } from "./items";

function belongsToCategory(item: StoreItem, category: PackCategory): boolean {
  if (category === "pokemon") {
    return item.id.startsWith("pk-");
  }
  return item.setId === category;
}

function isStorefrontEligible(item: StoreItem, category: PackCategory): boolean {
  if (category === "pokemon") {
    return isCollectiblePokemonStoreItem(item);
  }
  return Boolean(item.image?.trim());
}

export function getCategoryPool(category: PackCategory): StoreItem[] {
  const base = MOCK_ITEMS[category] ?? [];
  return base.filter(
    (item) => belongsToCategory(item, category) && isStorefrontEligible(item, category),
  );
}

/** Pack pulls only from whitelisted IDs in the same category — never bleeds across sports/TCG. */
export function getPackStoreItems(pack: Pack): StoreItem[] {
  const pool = getCategoryPool(pack.category);
  if (pool.length === 0) return [];

  if (!pack.items || pack.items.length === 0) {
    return [];
  }

  const allowed = new Set(pack.items);
  const coreItems = pool
    .filter((item) => allowed.has(item.id) && belongsToCategory(item, pack.category))
    .map((item) => {
      const image = sanitizeStoreItemImage(item.image, pack.category, item.id);
      return image === item.image ? item : { ...item, image };
    });

  const floorFillers = (
    getFloorFillersForPackId(pack.id).length > 0
      ? getFloorFillersForPackId(pack.id)
      : createFloorFillerItems(pack)
  ).filter((item) => isStorefrontEligible(item, pack.category));
  const seen = new Set(coreItems.map((item) => item.id));
  const packItems = [
    ...coreItems,
    ...floorFillers.filter((item) => !seen.has(item.id)),
  ];

  return applyValueScaledProbabilities(packItems, {
    spinCost: pack.cost,
    floorShare: packFloorShareOverride(pack.id),
    grailMaxProbability: packGrailMaxOverride(pack.id),
    grailMinProbability: packGrailMinOverride(pack.id),
  });
}

export function getPackStoreItemsById(packId: string, packs: Pack[]): StoreItem[] {
  const pack = packs.find((p) => p.id === packId);
  if (!pack) return [];
  return getPackStoreItems(pack);
}

export function cardPoolForCategory(category: PackCategory) {
  return getCategoryPool(category).map(storeItemToCard);
}
