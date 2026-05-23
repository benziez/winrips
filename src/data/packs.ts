import type { Pack, PackCategory } from "../types";
import { ACTIVE_POKEMON_PACK_IDS, LOBBY_PACK_CATALOG } from "../constants/packs";

export { LOBBY_PACK_CATALOG, buildCatalogPacks } from "../constants/packs";

/** @alias LOBBY_PACK_CATALOG */
export const MOCK_PACKS = LOBBY_PACK_CATALOG;

export const FEATURED_PACKS: Pack[] = LOBBY_PACK_CATALOG.filter(
  (p) => p.category === "pokemon",
);

const ACTIVE_POKEMON_PACK_ID_SET = new Set<string>(ACTIVE_POKEMON_PACK_IDS);

/** Launch catalog — Pokémon-only storefront. */
export function filterPacksByCategory(category: PackCategory | "all"): Pack[] {
  if (category !== "all" && category !== "pokemon") {
    return [];
  }
  return LOBBY_PACK_CATALOG.filter((pack) => ACTIVE_POKEMON_PACK_ID_SET.has(pack.id));
}
