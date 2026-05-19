import type { Pack, PackCategory } from "../types";
import type { StoreItem } from "../types/store";
import { NBA_ITEMS, NBA_ITEM_IDS } from "./nbaItems";
import { NFL_ITEMS, NFL_ITEM_IDS } from "./nflItems";
import { UFC_ITEMS, UFC_ITEM_IDS } from "./ufcItems";
import { YUGIOH_POOL, YUGIOH_ITEM_IDS } from "./categoryPools";
import { SPORTS_PLACEHOLDER_IMAGE } from "./sportsAssets";
import {
  GOD_PACK_1999_ITEM_IDS,
  LEGENDARY_HUNT_ITEM_IDS,
  PACK_151_ITEM_IDS,
  TRAINERS_STARTER_ITEM_IDS,
} from "./packPokemonPools";
import { POKEMON_ALL_ITEM_IDS, POKEMON_ITEMS } from "./pokemonCatalog";

export interface CatalogPack extends Pack {
  /** Seeded card IDs in this pack's drop pool — never auto-filled. */
  items: string[];
}

function coverFromCatalog(catalog: StoreItem[], name: string): string {
  return catalog.find((c) => c.name === name)?.image ?? catalog[0]?.image ?? "";
}

function allItemIds(catalog: StoreItem[]): string[] {
  return catalog.map((item) => item.id);
}

/** Active launch Pokémon packs — unique ~25-card pools per tier. */
export const ACTIVE_POKEMON_PACK_IDS = [
  "trainers-starter",
  "151-booster-collector",
  "legendary-hunt",
  "god-pack-1999",
] as const;

/** Pokémon mystery packs — exactly four launch tiers with distinct registries. */
export function buildPokemonPacks(): CatalogPack[] {
  return [
    {
      id: "trainers-starter",
      name: "Trainer's Starter Pack",
      cost: 100,
      theme: "gold",
      description:
        "Cheap, clean entry floor. Fun, modern holo cards and solid competitive unboxings.",
      category: "pokemon",
      image: coverFromCatalog(POKEMON_ITEMS, "Gholdengo"),
      items: [...TRAINERS_STARTER_ITEM_IDS],
      accentLabel: "BUDGET TIER",
    },
    {
      id: "151-booster-collector",
      name: "151 Booster Collector",
      cost: 1_000,
      theme: "gold",
      description:
        "Anchored around Scarlet & Violet 151 and Paradox Rift depth. High volume of ultra-rares.",
      category: "pokemon",
      image: coverFromCatalog(POKEMON_ITEMS, "Mew ex"),
      items: [...PACK_151_ITEM_IDS],
      accentLabel: "MID TIER",
    },
    {
      id: "legendary-hunt",
      name: "Legendary Hunt",
      cost: 2_500,
      theme: "fuchsia",
      description:
        "High variance — the floor drops a bit, but it is packed full of insane alternate-arts and secret rares.",
      category: "pokemon",
      image: coverFromCatalog(POKEMON_ITEMS, "Umbreon VMAX"),
      items: [...LEGENDARY_HUNT_ITEM_IDS],
      accentLabel: "⚡ HIGH VARIANCE",
    },
    {
      id: "god-pack-1999",
      name: "The 1999 God Pack",
      cost: 10_000,
      theme: "mystic",
      description:
        "Ultra-premium, low odds. Exclusively drops massive grail assets, gold stars, and ceiling chase hits.",
      category: "pokemon",
      image: coverFromCatalog(POKEMON_ITEMS, "Charizard Holo"),
      items: [...GOD_PACK_1999_ITEM_IDS],
      accentLabel: "1,000x CEILING",
    },
  ];
}

/** Sports packs — item IDs are sourced only from the matching catalog array. */
export function buildSportsAndTcgpPacks(): CatalogPack[] {
  const playoffNbaIds = NBA_ITEMS.filter(
    (item) => item.id !== "nba-m-lebron-graded",
  ).map((item) => item.id);

  const titleFightUfcIds = UFC_ITEMS.filter((item) =>
    ["Mythic", "Legendary", "Epic"].includes(item.rarity),
  ).map((item) => item.id);

  const sundayMaxNflIds = NFL_ITEMS.filter((item) =>
    ["Mythic", "Legendary", "Epic"].includes(item.rarity),
  ).map((item) => item.id);

  const forbiddenRiteYgoIds = YUGIOH_POOL.filter((item) =>
    ["Mythic", "Legendary", "Epic"].includes(item.rarity),
  ).map((item) => item.id);

  return [
    {
      id: "octagon-legends",
      name: "Octagon Legends Box",
      cost: 2_500,
      theme: "fuchsia",
      description: "Autographed fight-worn relics and octagon grails.",
      category: "ufc",
      visual: "ufc-octagon",
      image: SPORTS_PLACEHOLDER_IMAGE,
      items: allItemIds(UFC_ITEMS),
      accentLabel: "1,000x CEILING",
    },
    {
      id: "title-fight",
      name: "Title Fight Premium",
      cost: 7_500,
      theme: "gold",
      description: "Championship bout memorabilia drops.",
      category: "ufc",
      visual: "ufc-octagon",
      image: SPORTS_PLACEHOLDER_IMAGE,
      items: titleFightUfcIds,
      accentLabel: "⚡ HIGH VARIANCE",
    },
    {
      id: "all-star-hardwood",
      name: "All-Star Hardwood Drop",
      cost: 5_000,
      theme: "gold",
      description: "Court-ready slabs and signed hardwood hits.",
      category: "nba",
      visual: "nba-hardwood",
      image: SPORTS_PLACEHOLDER_IMAGE,
      items: allItemIds(NBA_ITEMS),
      accentLabel: "🔥 TRENDING",
    },
    {
      id: "playoff-pressure",
      name: "Playoff Pressure Pack",
      cost: 3_000,
      theme: "fuchsia",
      description: "Postseason heat — rookies and legends.",
      category: "nba",
      visual: "nba-hardwood",
      image: SPORTS_PLACEHOLDER_IMAGE,
      items: playoffNbaIds,
      accentLabel: "⚡ HIGH VARIANCE",
    },
    {
      id: "gridiron-legends",
      name: "Gridiron Legends Box",
      cost: 4_000,
      theme: "gold",
      description: "Helmet patches and championship relics.",
      category: "nfl",
      image: SPORTS_PLACEHOLDER_IMAGE,
      items: allItemIds(NFL_ITEMS),
      accentLabel: "🔥 TRENDING",
    },
    {
      id: "sunday-max",
      name: "Sunday Max Volatility",
      cost: 6_500,
      theme: "mystic",
      description: "High-variance football grails for serious collectors.",
      category: "nfl",
      image: SPORTS_PLACEHOLDER_IMAGE,
      items: sundayMaxNflIds,
      accentLabel: "1,000x CEILING",
    },
    {
      id: "duelists-vault",
      name: "Duelist's Secret Vault",
      cost: 3_500,
      theme: "mystic",
      description: "Ultra rares and ghost rare chase cards.",
      category: "yugioh",
      image: coverFromCatalog(YUGIOH_POOL, "LOB 1st Edition Blue-Eyes White Dragon"),
      items: [...YUGIOH_ITEM_IDS],
      accentLabel: "⚡ HIGH VARIANCE",
    },
    {
      id: "forbidden-rite",
      name: "Forbidden Rite Edition",
      cost: 8_000,
      theme: "fuchsia",
      description: "Limited print spell and trap supremacy.",
      category: "yugioh",
      image: coverFromCatalog(YUGIOH_POOL, "Dark Magician Ghost Rare"),
      items: forbiddenRiteYgoIds,
      accentLabel: "1,000x CEILING",
    },
  ];
}

export function buildCatalogPacks(): CatalogPack[] {
  return [...buildPokemonPacks(), ...buildSportsAndTcgpPacks()];
}

/** Dev-time guard: every whitelisted ID must exist in its category catalog. */
export function validatePackCatalog(packs: CatalogPack[]): void {
  const catalogs: Record<PackCategory, readonly string[]> = {
    pokemon: POKEMON_ALL_ITEM_IDS,
    nba: NBA_ITEM_IDS,
    nfl: NFL_ITEM_IDS,
    ufc: UFC_ITEM_IDS,
    yugioh: YUGIOH_ITEM_IDS,
  };

  for (const pack of packs) {
    const allowed = new Set(catalogs[pack.category]);
    for (const id of pack.items) {
      if (!allowed.has(id)) {
        throw new Error(
          `Pack "${pack.id}" (${pack.category}) references foreign item id "${id}"`,
        );
      }
    }
  }
}

export const LOBBY_PACK_CATALOG: CatalogPack[] = buildCatalogPacks();

if (import.meta.env.DEV) {
  try {
    validatePackCatalog(LOBBY_PACK_CATALOG);
  } catch (error) {
    console.error("[pack catalog]", error);
  }
}
