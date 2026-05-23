import type { MockItemsCatalog } from "../types/store";
import { filterCollectiblePokemonStoreItems } from "../lib/pokemonApi";
import { POKEMON_ITEMS } from "./pokemonCatalog";

/**
 * Unified storefront catalog — Pokémon-only at launch.
 * Pokémon cards are filtered to high-res collectibles only (no trainers/energy/code).
 */
export const MOCK_ITEMS: MockItemsCatalog = {
  pokemon: filterCollectiblePokemonStoreItems(POKEMON_ITEMS),
  nba: [],
  nfl: [],
  mlb: [],
  ufc: [],
  yugioh: [],
};

export { storeItemToCard } from "./pokemonCatalog";
