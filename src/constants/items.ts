import type { MockItemsCatalog } from "../types/store";
import { NBA_ITEMS } from "./nbaItems";
import { NFL_ITEMS } from "./nflItems";
import { UFC_ITEMS } from "./ufcItems";
import { YUGIOH_POOL } from "./categoryPools";
import { POKEMON_ITEMS } from "./pokemonCatalog";

/**
 * Unified storefront catalog — each category pool is strictly isolated.
 * Pokémon data is API-seeded in `pokemonCatalog.ts` (npm run seed:pokemon).
 */
export const MOCK_ITEMS: MockItemsCatalog = {
  pokemon: POKEMON_ITEMS,
  nba: NBA_ITEMS,
  nfl: NFL_ITEMS,
  ufc: UFC_ITEMS,
  yugioh: YUGIOH_POOL,
};

export { storeItemToCard } from "./pokemonCatalog";
