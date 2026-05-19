import type { Card, RecentDrop } from "../types";
import { cardPoolForCategory } from "../constants/catalog";
import type { PackCategory } from "../types";

/** Flat pool for a category (carousel fillers, legacy rolls). */
export function cardPoolForPackCategory(category: PackCategory): Card[] {
  return cardPoolForCategory(category);
}

/** Union of all category pools — fallback only. */
export const CARD_POOL: Card[] = (
  ["pokemon", "nba", "ufc", "nfl", "yugioh"] as PackCategory[]
).flatMap((category) => cardPoolForCategory(category));

export {
  MOCK_ITEMS,
  MOCK_ITEMS as STORE_CATALOG,
  storeItemToCard,
  getCategoryPool,
  getPackStoreItems,
} from "../constants/catalog";

export const RECENT_DROPS: RecentDrop[] = [
  { id: "d1", username: "CryptoKing", item: "Neon Blade", rarity: "Rare", avatar: "🦊" },
  { id: "d2", username: "VaultHunter", item: "Grail of Eternity", rarity: "Ancient Rare", avatar: "🐲" },
  { id: "d3", username: "NeonWolf", item: "Ember Coin", rarity: "Common", avatar: "🐺" },
  { id: "d4", username: "DropLord", item: "Gold Serpent", rarity: "Rare", avatar: "👹" },
];
