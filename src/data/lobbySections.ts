import type { Pack, PackCategory } from "../types";
import { ACTIVE_POKEMON_PACK_IDS, LOBBY_PACK_CATALOG } from "../constants/packs";

export interface LobbySection {
  id: string;
  title: string;
  categories: readonly PackCategory[];
  showComingSoonWhenEmpty?: boolean;
  /** Skeleton cards shown when the section has no live packs yet. */
  placeholderCount?: number;
}

export const LOBBY_SECTIONS: LobbySection[] = [
  {
    id: "pokemon",
    title: "Pokémon Drops",
    categories: ["pokemon"],
    showComingSoonWhenEmpty: true,
    placeholderCount: 8,
  },
];

const ACTIVE_POKEMON_PACK_ID_SET = new Set<string>(ACTIVE_POKEMON_PACK_IDS);

/** Supabase box ids with Pokémon lobby art. */
const REMOTE_POKEMON_BOX_IDS = new Set([
  "trainers-starter",
  "151-booster",
  "151-booster-collector",
  "mega-evolution",
  "legendary-hunt",
  "prismatic-sir",
  "evolving-skies",
  "1999-god",
  "god-pack-1999",
  "wotc-first-edition",
]);

function isPokemonPack(pack: Pack): boolean {
  if (pack.category !== "pokemon") return false;
  if (ACTIVE_POKEMON_PACK_ID_SET.has(pack.id)) return true;
  if (REMOTE_POKEMON_BOX_IDS.has(pack.id)) return true;
  return true;
}

export function packsForLobbySection(section: LobbySection, catalog: Pack[]): Pack[] {
  if (section.id !== "pokemon") return [];

  const pokemonCatalog = catalog.filter(isPokemonPack);
  if (pokemonCatalog.length === 0) {
    return LOBBY_PACK_CATALOG.filter(
      (pack) => isPokemonPack(pack) && ACTIVE_POKEMON_PACK_ID_SET.has(pack.id),
    );
  }

  return pokemonCatalog;
}
