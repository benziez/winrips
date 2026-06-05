import { findCatalogItemImageUrl, findCatalogItemStoreRarity } from "../data/boxCatalog";
import { RETAIL_COPY } from "./retail";
import type { StoreRarity } from "../types/store";

export interface WinsFeaturedCard {
  catalogItemId: string;
  displayName: string;
  displayUsd: number;
}

/** Curated showcase of the most impressive pulls available across all packs. */
export const WINS_FEATURED_CARDS: WinsFeaturedCard[] = [
  { catalogItemId: "pk-wotc-25", displayName: "Charizard 1st Ed Holo PSA 10", displayUsd: 24_500 },
  { catalogItemId: "pk-psa-02", displayName: "Umbreon VMAX Alt Art", displayUsd: 4_350 },
  { catalogItemId: "pk-wotc-20", displayName: "Charizard 1st Ed Holo", displayUsd: 3_800 },
  { catalogItemId: "pk-obs-05", displayName: "Giratina V Alt Art", displayUsd: 480 },
  { catalogItemId: "pk-obs-04", displayName: "Lugia V Alt Art", displayUsd: 380 },
  { catalogItemId: "pk-hunt-05", displayName: "Umbreon VMAX", displayUsd: 1_950 },
  { catalogItemId: "pk-151-16", displayName: "Mewtwo ex SAR", displayUsd: 145 },
  { catalogItemId: "pk-151-19", displayName: "Mew ex SAR", displayUsd: 55 },
  { catalogItemId: "pk-151-24", displayName: "Charizard ex SAR", displayUsd: 95 },
  { catalogItemId: "pk-hunt-03", displayName: "Origin Forme Dialga VSTAR", displayUsd: 90 },
  { catalogItemId: "pk-hunt-06", displayName: "Rayquaza VMAX", displayUsd: 580 },
  { catalogItemId: "pk-starter-26", displayName: "Miraidon ex", displayUsd: 15 },
];

export interface ResolvedFeaturedCard extends WinsFeaturedCard {
  image: string;
  storeRarity: StoreRarity;
  displayGems: number;
}

export function featuredCardDisplayGems(displayUsd: number): number {
  return Math.round(displayUsd * RETAIL_COPY.gemsPerUsd);
}

export function resolveFeaturedCards(): ResolvedFeaturedCard[] {
  return WINS_FEATURED_CARDS.map((card) => ({
    ...card,
    image: findCatalogItemImageUrl(card.catalogItemId),
    storeRarity: findCatalogItemStoreRarity(card.catalogItemId),
    displayGems: featuredCardDisplayGems(card.displayUsd),
  }));
}
