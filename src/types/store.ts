import type { PackCategory, Rarity } from "./index";

/** Storefront tier labels from seeded catalog data. */
export type StoreRarity = "Common" | "Epic" | "Rare" | "Legendary" | "Mythic";

/** Maps seeded tiers to in-app rarity badges / FX. */
export type AppRarity = Rarity;

export type ItemCategory = PackCategory;

export interface StoreItem {
  id: string;
  name: string;
  rarity: StoreRarity;
  appRarity: AppRarity;
  /** Gem value (~100 Gems = $1 USD). */
  value: number;
  image: string;
  /** Drop weight as percent (all items in a pool sum to 100). */
  probability: number;
  tcgMarketUsd: number;
  setId: string;
  setName: string;
  number: string;
}

export type MockItemsCatalog = Record<ItemCategory, StoreItem[]>;

export const STORE_TIERS: StoreRarity[] = [
  "Mythic",
  "Legendary",
  "Epic",
  "Rare",
  "Common",
];
