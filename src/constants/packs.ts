import type { Pack } from "../types";
import type { StoreItem } from "../types/store";
import { getPackStoreItems } from "./catalog";
import { getFloorFillersForPackId, isFloorFillerItemId } from "./floorFillers";
import { initializePackFloorEconomy } from "./packEconomy";
import {
  computePackExpectedValue,
  expectedValueBounds,
  targetPackExpectedValue,
} from "../utils/packProbability";
import { logger } from "../lib/logger";
import {
  EVOLVING_SKIES_ITEM_IDS,
  GOD_PACK_1999_ITEM_IDS,
  LEGENDARY_HUNT_ITEM_IDS,
  MEGA_EVOLUTION_ITEM_IDS,
  OBSIDIAN_VAULT_ITEM_IDS,
  PACK_151_ITEM_IDS,
  PRISMATIC_SIR_ITEM_IDS,
  PSA_10_CHASER_ITEM_IDS,
  SHINY_VAULT_ITEM_IDS,
  TRAINERS_STARTER_ITEM_IDS,
  WAIFU_VAULT_ITEM_IDS,
  WOTC_FIRST_EDITION_ITEM_IDS,
} from "./packPokemonPools";
import { POKEMON_ALL_ITEM_IDS, POKEMON_ITEMS } from "./pokemonCatalog";

export interface CatalogPack extends Pack {
  /** Seeded card IDs in this pack's drop pool — never auto-filled. */
  items: string[];
}

function coverFromCatalog(catalog: StoreItem[], name: string): string {
  return catalog.find((c) => c.name === name)?.image ?? catalog[0]?.image ?? "";
}

function tcgCover(setId: string, number: string): string {
  return `https://images.pokemontcg.io/${setId}/${number}_hires.png`;
}

/** Active launch Pokémon packs — unique ~25-card pools per tier. */
export const ACTIVE_POKEMON_PACK_IDS = [
  "trainers-starter",
  "151-booster-collector",
  "mega-evolution",
  "legendary-hunt",
  "prismatic-sir",
  "evolving-skies",
  "god-pack-1999",
  "wotc-first-edition",
  "obsidian-vault",
  "psa-10-chaser",
  "waifu-vault",
  "shiny-vault",
] as const;

/** Pokémon mystery packs — eight launch tiers with distinct registries. */
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
      id: "mega-evolution",
      name: "Mega Evolution EX",
      cost: 1_500,
      theme: "gold",
      description: "Devastating power from classic Mega Evolution EX sets.",
      category: "pokemon",
      image: coverFromCatalog(POKEMON_ITEMS, "Mega Rayquaza EX"),
      items: [...MEGA_EVOLUTION_ITEM_IDS],
      accentLabel: "MEGA POWER",
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
      id: "prismatic-sir",
      name: "Prismatic Special SIR",
      cost: 4_500,
      theme: "fuchsia",
      description: "Chasing the premium Eeveelution Stellar Special Illustration Rares.",
      category: "pokemon",
      image: coverFromCatalog(POKEMON_ITEMS, "Umbreon SIR"),
      items: [...PRISMATIC_SIR_ITEM_IDS],
      accentLabel: "✨ SIR CHASE",
    },
    {
      id: "evolving-skies",
      name: "Evolving Skies Chase",
      cost: 6_500,
      theme: "mystic",
      description: "The absolute peak of modern alternate art grails.",
      category: "pokemon",
      image: coverFromCatalog(POKEMON_ITEMS, "Rayquaza VMAX Alt Art"),
      items: [...EVOLVING_SKIES_ITEM_IDS],
      accentLabel: "🔥 ALT ART",
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
    {
      id: "wotc-first-edition",
      name: "WOTC 1st Edition Classic",
      cost: 25_000,
      theme: "mystic",
      description: "Elite, high-end vintage 1999-2000 first edition holos only.",
      category: "pokemon",
      image: coverFromCatalog(POKEMON_ITEMS, "Charizard 1st Ed Holo"),
      items: [...WOTC_FIRST_EDITION_ITEM_IDS],
      accentLabel: "VINTAGE GRAIL",
    },
    {
      id: "obsidian-vault",
      name: "The Obsidian Vault",
      cost: 10_000,
      theme: "mystic",
      description: "Ultra-premium obsidian-tier vault drops — vintage holos and modern alt-art grails.",
      category: "pokemon",
      image: tcgCover("base1", "4"),
      items: [...OBSIDIAN_VAULT_ITEM_IDS],
      accentLabel: "OBSIDIAN TIER",
    },
    {
      id: "psa-10-chaser",
      name: "The PSA 10 Chaser",
      cost: 5_000,
      theme: "fuchsia",
      description: "Chase gem-mint PSA 10 slabs from the hottest modern sets.",
      category: "pokemon",
      image: tcgCover("swsh7", "215"),
      items: [...PSA_10_CHASER_ITEM_IDS],
      accentLabel: "PSA 10 CHASE",
    },
    {
      id: "waifu-vault",
      name: "Trainer Gallery",
      cost: 2_500,
      theme: "fuchsia",
      description: "Premium supporter full-art gallery — Lillie, Iono, Miriam, and more.",
      category: "pokemon",
      image: tcgCover("sm1", "147"),
      items: [...WAIFU_VAULT_ITEM_IDS],
      accentLabel: "TRAINER GALLERY",
    },
    {
      id: "shiny-vault",
      name: "The Shiny Vault",
      cost: 1_500,
      theme: "gold",
      description: "Hidden Fates shiny vault hits — rainbow-rare GX chase cards.",
      category: "pokemon",
      image: tcgCover("sma", "SV49"),
      items: [...SHINY_VAULT_ITEM_IDS],
      accentLabel: "SHINY VAULT",
    },
  ];
}

export function buildCatalogPacks(): CatalogPack[] {
  return initializePackFloorEconomy(buildPokemonPacks());
}

/** Dev-time guard: every whitelisted ID must exist in the Pokémon catalog. */
export function validatePackCatalog(packs: CatalogPack[]): void {
  const allowed = new Set(POKEMON_ALL_ITEM_IDS);
  const floorIds = (packId: string) =>
    new Set(getFloorFillersForPackId(packId).map((item) => item.id));

  for (const pack of packs) {
    if (pack.category !== "pokemon") {
      throw new Error(`Launch catalog must be Pokémon-only — found "${pack.id}" (${pack.category})`);
    }

    const floors = floorIds(pack.id);
    for (const id of pack.items) {
      if (allowed.has(id) || floors.has(id) || isFloorFillerItemId(id)) continue;
      throw new Error(
        `Pack "${pack.id}" (${pack.category}) references foreign item id "${id}"`,
      );
    }
  }
}

export const LOBBY_PACK_CATALOG: CatalogPack[] = buildCatalogPacks();

if (import.meta.env?.DEV) {
  try {
    validatePackCatalog(LOBBY_PACK_CATALOG);
    for (const pack of LOBBY_PACK_CATALOG) {
      const items = getPackStoreItems(pack);
      const ev = computePackExpectedValue(items);
      const { min, max } = expectedValueBounds(pack.cost);
      const target = targetPackExpectedValue(pack.cost);
      if (ev < min - 1 || ev > max + 1) {
        logger.warn(
          `[pack economy] ${pack.id}: EV ${ev.toFixed(2)} outside ${min.toFixed(0)}–${max.toFixed(0)} (target ${target.toFixed(0)})`,
        );
      }
    }
  } catch (error) {
    logger.error("[pack catalog]", error);
  }
}
