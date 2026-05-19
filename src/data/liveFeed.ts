import type { CatalogPack } from "../constants/packs";
import { ACTIVE_POKEMON_PACK_IDS, LOBBY_PACK_CATALOG } from "../constants/packs";
import { getPackStoreItems } from "../constants/catalog";
import { POKEMON_ITEMS } from "../constants/pokemonCatalog";
import type { StoreItem } from "../types/store";

const ACTIVE_POKEMON_PACK_ID_SET = new Set<string>(ACTIVE_POKEMON_PACK_IDS);

/** Bump to force live tickers to reseed after pool changes (dev HMR). */
export const LIVE_FEED_POOL_VERSION = 2;

/** Launch-only packs surfaced in live lobby feeds — never sports or Yu-Gi-Oh. */
export const LIVE_FEED_PACKS: CatalogPack[] = LOBBY_PACK_CATALOG.filter((pack) =>
  ACTIVE_POKEMON_PACK_ID_SET.has(pack.id),
);

export function isPokemonStoreItem(item: StoreItem): boolean {
  return item.id.startsWith("pk-");
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Random pack + item for live tickers. Always Paradox Rift (sv4) — ignores category tab
 * until non-Pokémon categories launch.
 */
export function pickPokemonPackWithItems(): { pack: CatalogPack; pool: StoreItem[] } {
  const shuffled = [...LIVE_FEED_PACKS].sort(() => Math.random() - 0.5);

  for (const pack of shuffled) {
    const pool = getPackStoreItems(pack).filter(isPokemonStoreItem);
    if (pool.length > 0) return { pack, pool };
  }

  const fallbackPack = LIVE_FEED_PACKS[0];
  if (fallbackPack) {
    const pool = getPackStoreItems(fallbackPack).filter(isPokemonStoreItem);
    if (pool.length > 0) return { pack: fallbackPack, pool };
  }

  const pack = LIVE_FEED_PACKS[0];
  return {
    pack: pack!,
    pool: POKEMON_ITEMS.filter(isPokemonStoreItem),
  };
}

export function pickRandomPokemonStoreItem(pool: StoreItem[]): StoreItem {
  const eligible = pool.filter(isPokemonStoreItem);
  const source = eligible.length > 0 ? eligible : POKEMON_ITEMS.filter(isPokemonStoreItem);
  return pick(source.length > 0 ? source : POKEMON_ITEMS);
}
