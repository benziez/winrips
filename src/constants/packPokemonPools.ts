import type { StoreItem, StoreRarity } from "../types/store";
import type { Rarity } from "../types";

function tcgImage(setId: string, number: string): string {
  return `https://images.pokemontcg.io/${setId}/${number}.png`;
}

function defineItem(
  id: string,
  name: string,
  setId: string,
  setName: string,
  number: string,
  ...tail: (string | number)[]
): StoreItem {
  const hasExplicitImage =
    typeof tail[0] === "string" &&
    (tail[0].startsWith("https://") || tail[0].startsWith("http://"));
  const image = hasExplicitImage ? String(tail[0]) : tcgImage(setId, number);
  const rarity = (hasExplicitImage ? tail[1] : tail[0]) as StoreRarity;
  const appRarity = (hasExplicitImage ? tail[2] : tail[1]) as Rarity;
  const value = Number(hasExplicitImage ? tail[3] : tail[2]);
  const probability = Number(hasExplicitImage ? tail[4] : tail[3]);
  const tcgMarketUsd = Number(hasExplicitImage ? tail[5] : tail[4]);

  return {
    id,
    name,
    rarity,
    appRarity,
    value,
    image,
    probability,
    tcgMarketUsd,
    setId,
    setName,
    number,
  };
}

/** Trainer's Starter — 25 modern Paradox Rift floor cards (commons, uncommons, holo rares). */
export const TRAINERS_STARTER_POOL: StoreItem[] = [
  defineItem("pk-starter-01", "Nymble", "sv4", "Paradox Rift", "14", "https://images.pokemontcg.io/sv4/14_hires.png", "Common", "Common", 12, 2.2, 0.12),
  defineItem("pk-starter-02", "Toedscool", "sv4", "Paradox Rift", "15", "https://images.pokemontcg.io/sv4/15_hires.png", "Common", "Common", 15, 2.1, 0.15),
  defineItem("pk-starter-03", "Toedscool", "sv4", "Paradox Rift", "16", "https://images.pokemontcg.io/sv4/16_hires.png", "Common", "Common", 11, 2.1, 0.11),
  defineItem("pk-starter-04", "Toedscruel", "sv4", "Paradox Rift", "17", "https://images.pokemontcg.io/sv4/17_hires.png", "Common", "Common", 14, 2, 0.14),
  defineItem("pk-starter-05", "Simipour", "sv4", "Paradox Rift", "42", "https://images.pokemontcg.io/sv4/42_hires.png", "Common", "Common", 10, 2.1, 0.1),
  defineItem("pk-starter-06", "Vanillite", "sv4", "Paradox Rift", "43", "https://images.pokemontcg.io/sv4/43_hires.png", "Common", "Common", 18, 2, 0.18),
  defineItem("pk-starter-07", "Spinda", "sv4", "Paradox Rift", "151", "https://images.pokemontcg.io/sv4/151_hires.png", "Common", "Common", 9, 2.2, 0.09),
  defineItem("pk-starter-08", "Swablu", "sv4", "Paradox Rift", "152", "https://images.pokemontcg.io/sv4/152_hires.png", "Common", "Common", 10, 2.2, 0.1),
  defineItem("pk-starter-09", "Tandemaus", "sv4", "Paradox Rift", "153", "https://images.pokemontcg.io/sv4/153_hires.png", "Common", "Common", 11, 2.1, 0.11),
  defineItem("pk-starter-10", "Cyclizar", "sv4", "Paradox Rift", "157", "https://images.pokemontcg.io/sv4/157_hires.png", "Common", "Common", 13, 2, 0.13),
  defineItem("pk-starter-11", "Gimmighoul", "sv4", "Paradox Rift", "87", "https://images.pokemontcg.io/sv4/87_hires.png", "Common", "Common", 16, 1.9, 0.16),
  defineItem("pk-starter-12", "Onix", "sv4", "Paradox Rift", "90", "https://images.pokemontcg.io/sv4/90_hires.png", "Common", "Common", 12, 2, 0.12),
  defineItem("pk-starter-13", "Gible", "sv4", "Paradox Rift", "94", "https://images.pokemontcg.io/sv4/94_hires.png", "Common", "Common", 10, 2.1, 0.1),
  defineItem("pk-starter-14", "Altaria ex", "sv4", "Paradox Rift", "140", "https://images.pokemontcg.io/sv4/140_hires.png", "Common", "Common", 14, 2, 0.14),
  defineItem("pk-starter-15", "Tatsugiri", "sv4", "Paradox Rift", "141", "https://images.pokemontcg.io/sv4/141_hires.png", "Common", "Common", 15, 1.9, 0.15),
  defineItem("pk-starter-16", "Gimmighoul", "sv4", "Paradox Rift", "88", "https://images.pokemontcg.io/sv4/88_hires.png", "Rare", "Rare", 45, 4.2, 0.45),
  defineItem("pk-starter-17", "Mienfoo", "sv4", "Paradox Rift", "96", "https://images.pokemontcg.io/sv4/96_hires.png", "Rare", "Rare", 55, 4, 0.55),
  defineItem("pk-starter-18", "Iron Moth", "sv4", "Paradox Rift", "28", "https://images.pokemontcg.io/sv4/28_hires.png", "Rare", "Rare", 50, 4, 0.5),
  defineItem("pk-starter-19", "Klawf", "sv4", "Paradox Rift", "105", "https://images.pokemontcg.io/sv4/105_hires.png", "Rare", "Rare", 48, 3.8, 0.48),
  defineItem("pk-starter-20", "Aipom", "sv4", "Paradox Rift", "145", "https://images.pokemontcg.io/sv4/145_hires.png", "Rare", "Rare", 62, 3.6, 0.62),
  defineItem("pk-starter-21", "Crocalor", "sv4", "Paradox Rift", "24", "https://images.pokemontcg.io/sv4/24_hires.png", "Epic", "Rare", 120, 3, 1.2),
  defineItem("pk-starter-22", "Wiglett", "sv4", "Paradox Rift", "52", "https://images.pokemontcg.io/sv4/52_hires.png", "Epic", "Rare", 110, 2.8, 1.1),
  defineItem("pk-starter-23", "Mienshao", "sv4", "Paradox Rift", "97", "https://images.pokemontcg.io/sv4/97_hires.png", "Epic", "Rare", 135, 2.6, 1.35),
  defineItem("pk-starter-24", "Flamigo", "sv4", "Paradox Rift", "106", "https://images.pokemontcg.io/sv4/106_hires.png", "Epic", "Rare", 180, 2.4, 1.8),
  defineItem("pk-starter-25", "Zacian", "sv4", "Paradox Rift", "136", "https://images.pokemontcg.io/sv4/136_hires.png", "Epic", "Rare", 240, 2.2, 2.4),
  defineItem("pk-starter-26", "Miraidon ex", "sv1", "Scarlet & Violet", "244", "https://images.pokemontcg.io/sv1/244_hires.png", "Legendary", "Ancient Rare", 1500, 8, 15),
  defineItem("pk-starter-27", "Spidops ex", "sv1", "Scarlet & Violet", "243", "https://images.pokemontcg.io/sv1/243_hires.png", "Legendary", "Ancient Rare", 1200, 8, 12),
];

/** 151 Booster Collector — 25 Scarlet & Violet 151 (sv3pt5) chase cards. */
export const PACK_151_POOL: StoreItem[] = [
  defineItem("pk-151-01", "Bulbasaur", "sv3pt5", "151", "1", "https://images.pokemontcg.io/sv3pt5/1_hires.png", "Common", "Common", 35, 4.5, 0.35),
  defineItem("pk-151-02", "Charmander", "sv3pt5", "151", "4", "https://images.pokemontcg.io/sv3pt5/4_hires.png", "Common", "Common", 38, 4.5, 0.38),
  defineItem("pk-151-03", "Squirtle", "sv3pt5", "151", "7", "https://images.pokemontcg.io/sv3pt5/7_hires.png", "Common", "Common", 36, 4.5, 0.36),
  defineItem("pk-151-04", "Pikachu", "sv3pt5", "151", "25", "https://images.pokemontcg.io/sv3pt5/25_hires.png", "Rare", "Rare", 110, 4, 1.1),
  defineItem("pk-151-05", "Eevee", "sv3pt5", "151", "133", "https://images.pokemontcg.io/sv3pt5/133_hires.png", "Rare", "Rare", 140, 3.8, 1.4),
  defineItem("pk-151-06", "Snorlax", "sv3pt5", "151", "143", "https://images.pokemontcg.io/sv3pt5/143_hires.png", "Rare", "Rare", 160, 3.6, 1.6),
  defineItem("pk-151-07", "Bulbasaur", "sv3pt5", "151", "166", "https://images.pokemontcg.io/sv3pt5/166_hires.png", "Epic", "Rare", 450, 3.2, 4.5),
  defineItem("pk-151-08", "Charmander", "sv3pt5", "151", "168", "https://images.pokemontcg.io/sv3pt5/168_hires.png", "Epic", "Rare", 520, 3, 5.2),
  defineItem("pk-151-09", "Squirtle", "sv3pt5", "151", "170", "https://images.pokemontcg.io/sv3pt5/170_hires.png", "Epic", "Rare", 480, 3, 4.8),
  defineItem("pk-151-10", "Pikachu", "sv3pt5", "151", "173", "https://images.pokemontcg.io/sv3pt5/173_hires.png", "Epic", "Rare", 750, 2.8, 7.5),
  defineItem("pk-151-11", "Nidoking", "sv3pt5", "151", "174", "https://images.pokemontcg.io/sv3pt5/174_hires.png", "Epic", "Rare", 390, 3.2, 3.9),
  defineItem("pk-151-12", "Tangela", "sv3pt5", "151", "178", "https://images.pokemontcg.io/sv3pt5/178_hires.png", "Epic", "Rare", 320, 3.4, 3.2),
  defineItem("pk-151-13", "Charizard ex", "sv3pt5", "151", "183", "https://images.pokemontcg.io/sv3pt5/183_hires.png", "Legendary", "Rare", 1800, 2.4, 18),
  defineItem("pk-151-14", "Blastoise ex", "sv3pt5", "151", "184", "https://images.pokemontcg.io/sv3pt5/184_hires.png", "Legendary", "Rare", 2400, 2.2, 24),
  defineItem("pk-151-15", "Arbok ex", "sv3pt5", "151", "185", "https://images.pokemontcg.io/sv3pt5/185_hires.png", "Legendary", "Rare", 2000, 2.4, 20),
  defineItem("pk-151-16", "Kangaskhan ex", "sv3pt5", "151", "190", "https://images.pokemontcg.io/sv3pt5/190_hires.png", "Legendary", "Rare", 2800, 2, 28),
  defineItem("pk-151-17", "Alakazam ex", "sv3pt5", "151", "201", "https://images.pokemontcg.io/sv3pt5/201_hires.png", "Legendary", "Rare", 1600, 2.6, 16),
  defineItem("pk-151-18", "Zapdos ex", "sv3pt5", "151", "202", "https://images.pokemontcg.io/sv3pt5/202_hires.png", "Legendary", "Rare", 1500, 2.6, 15),
  defineItem("pk-151-19", "Mew ex", "sv3pt5", "151", "193", "https://images.pokemontcg.io/sv3pt5/193_hires.png", "Mythic", "Ancient Rare", 5500, 1.8, 55),
  defineItem("pk-151-20", "Charizard ex", "sv3pt5", "151", "199", "https://images.pokemontcg.io/sv3pt5/199_hires.png", "Mythic", "Ancient Rare", 6800, 1.6, 68),
  defineItem("pk-151-21", "Blastoise ex", "sv3pt5", "151", "200", "https://images.pokemontcg.io/sv3pt5/200_hires.png", "Mythic", "Ancient Rare", 6200, 1.6, 62),
  defineItem("pk-151-22", "Venusaur ex", "sv3pt5", "151", "198", "https://images.pokemontcg.io/sv3pt5/198_hires.png", "Mythic", "Ancient Rare", 5200, 1.8, 52),
  defineItem("pk-151-23", "Mew ex", "sv3pt5", "151", "205", "https://images.pokemontcg.io/sv3pt5/205_hires.png", "Mythic", "Ancient Rare", 14500, 1, 145),
  defineItem("pk-151-24", "Charizard ex", "sv3pt5", "151", "199", "https://images.pokemontcg.io/sv3pt5/199_hires.png", "Mythic", "Ancient Rare", 9500, 1.2, 95),
  defineItem("pk-151-25", "Mew ex", "sv3pt5", "151", "193", "https://images.pokemontcg.io/sv3pt5/193_hires.png", "Mythic", "Ancient Rare", 7200, 1.4, 72),
];

/** Legendary Hunt — 25 SWSH & SV alternate arts / illustration rares. */
export const LEGENDARY_HUNT_POOL: StoreItem[] = [
  defineItem("pk-hunt-01", "Giratina V", "swsh11", "Lost Origin", "130", "https://images.pokemontcg.io/swsh11/130_hires.png", "Mythic", "Ancient Rare", 48000, 2, 480),
  defineItem("pk-hunt-02", "Lugia V Alt Art", "swsh12", "Silver Tempest", "186", "https://images.pokemontcg.io/swsh12/186_hires.png", "Mythic", "Ancient Rare", 38000, 2.2, 380),
  defineItem("pk-hunt-03", "Irida", "swsh10", "Astral Radiance", "186", "https://images.pokemontcg.io/swsh10/186_hires.png", "Mythic", "Ancient Rare", 9000, 2.4, 90),
  defineItem("pk-hunt-04", "Kamado", "swsh10", "Astral Radiance", "187", "https://images.pokemontcg.io/swsh10/187_hires.png", "Mythic", "Ancient Rare", 8500, 2.4, 85),
  defineItem("pk-hunt-05", "Umbreon VMAX", "swsh7", "Evolving Skies", "215", "https://images.pokemontcg.io/swsh7/215_hires.png", "Mythic", "Ancient Rare", 195000, 1.6, 1950),
  defineItem("pk-hunt-06", "Rayquaza VMAX", "swsh7", "Evolving Skies", "217", "https://images.pokemontcg.io/swsh7/217_hires.png", "Mythic", "Ancient Rare", 58000, 2.2, 580),
  defineItem("pk-hunt-07", "Arceus VSTAR", "swsh9", "Brilliant Stars", "184", "Legendary", "Rare", 3200, 3.2, 32),
  defineItem("pk-hunt-08", "Charizard VSTAR", "swsh9", "Brilliant Stars", "174", "https://images.pokemontcg.io/swsh9/174_hires.png", "Legendary", "Rare", 2800, 3.4, 28),
  defineItem("pk-hunt-09", "Gardevoir ex", "sv1", "Scarlet & Violet", "245", "https://images.pokemontcg.io/sv1/245_hires.png", "Mythic", "Ancient Rare", 5800, 2, 58),
  defineItem("pk-hunt-10", "Miraidon ex", "sv1", "Scarlet & Violet", "244", "https://images.pokemontcg.io/sv1/244_hires.png", "Mythic", "Ancient Rare", 5200, 2.2, 52),
  defineItem("pk-hunt-11", "Paldean Clodsire ex", "sv2", "Paldea Evolved", "244", "https://images.pokemontcg.io/sv2/244_hires.png", "Mythic", "Ancient Rare", 6800, 2, 68),
  defineItem("pk-hunt-12", "Copperajah ex", "sv2", "Paldea Evolved", "245", "https://images.pokemontcg.io/sv2/245_hires.png", "Legendary", "Rare", 2400, 3.6, 24),
  defineItem("pk-hunt-13", "Charizard ex", "sv3", "Obsidian Flames", "223", "https://images.pokemontcg.io/sv3/223_hires.png", "Mythic", "Ancient Rare", 8200, 1.8, 82),
  defineItem("pk-hunt-14", "Charizard ex", "sv3", "Obsidian Flames", "228", "https://images.pokemontcg.io/sv3/228_hires.png", "Mythic", "Ancient Rare", 9500, 1.6, 95),
  defineItem("pk-hunt-15", "Pidgeot ex", "sv3", "Obsidian Flames", "225", "https://images.pokemontcg.io/sv3/225_hires.png", "Legendary", "Rare", 2200, 3.8, 22),
  defineItem("pk-hunt-16", "Garchomp ex", "sv4", "Paradox Rift", "245", "https://images.pokemontcg.io/sv4/245_hires.png", "Mythic", "Ancient Rare", 5500, 2, 55),
  defineItem("pk-hunt-17", "Iron Valiant ex", "sv4", "Paradox Rift", "249", "https://images.pokemontcg.io/sv4/249_hires.png", "Mythic", "Ancient Rare", 4800, 2.2, 48),
  defineItem("pk-hunt-18", "Roaring Moon ex", "sv4", "Paradox Rift", "251", "https://images.pokemontcg.io/sv4/251_hires.png", "Mythic", "Ancient Rare", 6000, 2, 60),
  defineItem("pk-hunt-19", "Gholdengo ex", "sv4", "Paradox Rift", "252", "https://images.pokemontcg.io/sv4/252_hires.png", "Legendary", "Rare", 2000, 4, 20),
  defineItem("pk-hunt-20", "Mew ex", "sv3pt5", "151", "205", "https://images.pokemontcg.io/sv3pt5/205_hires.png", "Mythic", "Ancient Rare", 11000, 1.4, 110),
  defineItem("pk-hunt-21", "Charizard ex", "sv3pt5", "151", "199", "https://images.pokemontcg.io/sv3pt5/199_hires.png", "Mythic", "Ancient Rare", 8800, 1.6, 88),
  defineItem("pk-hunt-22", "Blaziken VMAX", "swsh6", "Chilling Reign", "201", "https://images.pokemontcg.io/swsh6/201_hires.png", "Legendary", "Rare", 1800, 4.2, 18),
  defineItem("pk-hunt-23", "Leafeon VMAX", "swsh7", "Evolving Skies", "205", "https://images.pokemontcg.io/swsh7/205_hires.png", "Legendary", "Rare", 2600, 3.6, 26),
  defineItem("pk-hunt-24", "Sylveon VMAX", "swsh7", "Evolving Skies", "212", "https://images.pokemontcg.io/swsh7/212_hires.png", "Legendary", "Rare", 3000, 3.2, 30),
  defineItem("pk-hunt-25", "Giratina VSTAR", "swsh11", "Lost Origin", "131", "https://images.pokemontcg.io/swsh11/131_hires.png", "Epic", "Rare", 1600, 4.4, 16),
];

/** The 1999 God Pack — 23 vintage base-set grails; floor ~800 Gems ($8 NM). */
export const GOD_PACK_1999_POOL: StoreItem[] = [
  defineItem("pk-god-01", "Machoke", "base1", "Base", "34", "https://images.pokemontcg.io/base1/34_hires.png", "Rare", "Rare", 800, 6, 8),
  defineItem("pk-god-02", "Magneton", "base1", "Base", "9", "https://images.pokemontcg.io/base1/9_hires.png", "Rare", "Rare", 1200, 5.5, 12),
  defineItem("pk-god-03", "Electabuzz", "base1", "Base", "20", "https://images.pokemontcg.io/base1/20_hires.png", "Rare", "Rare", 1000, 5.8, 10),
  defineItem("pk-god-04", "Ninetales", "base1", "Base", "12", "https://images.pokemontcg.io/base1/12_hires.png", "Rare", "Rare", 1400, 5.2, 14),
  defineItem("pk-god-05", "Poliwrath", "base1", "Base", "13", "https://images.pokemontcg.io/base1/13_hires.png", "Rare", "Rare", 1300, 5.4, 13),
  defineItem("pk-god-06", "Raichu", "base1", "Base", "14", "https://images.pokemontcg.io/base1/14_hires.png", "Rare", "Rare", 1600, 5, 16),
  defineItem("pk-god-07", "Clefairy Holo", "base1", "Base", "5", "https://images.pokemontcg.io/base1/5_hires.png", "Epic", "Rare", 2200, 4.6, 22),
  defineItem("pk-god-08", "Nidoking Holo", "base1", "Base", "11", "https://images.pokemontcg.io/base1/11_hires.png", "Epic", "Rare", 2000, 4.8, 20),
  defineItem("pk-god-09", "Gyarados Holo", "base1", "Base", "6", "https://images.pokemontcg.io/base1/6_hires.png", "Legendary", "Rare", 5500, 3.8, 55),
  defineItem("pk-god-10", "Alakazam Holo", "base1", "Base", "1", "https://images.pokemontcg.io/base1/1_hires.png", "Legendary", "Rare", 6800, 3.4, 68),
  defineItem("pk-god-11", "Machamp Holo", "base1", "Base", "8", "https://images.pokemontcg.io/base1/8_hires.png", "Legendary", "Rare", 4200, 4, 42),
  defineItem("pk-god-12", "Zapdos Holo", "base1", "Base", "16", "https://images.pokemontcg.io/base1/16_hires.png", "Legendary", "Rare", 7500, 3.2, 75),
  defineItem("pk-god-13", "Mewtwo Holo", "base1", "Base", "10", "https://images.pokemontcg.io/base1/10_hires.png", "Mythic", "Ancient Rare", 22000, 2.4, 220),
  defineItem("pk-god-14", "Venusaur Holo", "base1", "Base", "15", "https://images.pokemontcg.io/base1/15_hires.png", "Mythic", "Ancient Rare", 26000, 2, 260),
  defineItem("pk-god-15", "Blastoise Holo", "base1", "Base", "2", "https://images.pokemontcg.io/base1/2_hires.png", "Mythic", "Ancient Rare", 32000, 1.8, 320),
  defineItem("pk-god-16", "Charizard Holo", "base1", "Base", "4", "https://images.pokemontcg.io/base1/4_hires.png", "Mythic", "Ancient Rare", 55000, 1.2, 550),
  defineItem("pk-god-17", "Charizard Holo — PSA 8", "base1", "Base", "4", "https://images.pokemontcg.io/base1/4_hires.png", "Mythic", "Ancient Rare", 100000, 1.6, 1000),
  defineItem("pk-god-18", "Blastoise Holo — PSA 9", "base1", "Base", "2", "https://images.pokemontcg.io/base1/2_hires.png", "Mythic", "Ancient Rare", 65000, 1.8, 650),
  defineItem("pk-god-19", "Venusaur Holo — PSA 9", "base1", "Base", "15", "https://images.pokemontcg.io/base1/15_hires.png", "Mythic", "Ancient Rare", 55000, 2, 550),
  defineItem("pk-god-20", "Mewtwo Holo — PSA 9", "base1", "Base", "10", "https://images.pokemontcg.io/base1/10_hires.png", "Mythic", "Ancient Rare", 70000, 2.2, 700),
  defineItem("pk-god-21", "Chansey Holo", "base1", "Base", "3", "https://images.pokemontcg.io/base1/3_hires.png", "Legendary", "Rare", 9500, 3, 95),
  defineItem("pk-god-22", "Hitmonchan Holo", "base1", "Base", "7", "https://images.pokemontcg.io/base1/7_hires.png", "Legendary", "Rare", 7800, 3.2, 78),
  defineItem("pk-god-23", "Charizard Holo — BGS 9.5", "base1", "Base", "4", "https://images.pokemontcg.io/base1/4_hires.png", "Mythic", "Ancient Rare", 200000, 0.8, 2000),
];

/** Mega Evolution EX — 25 XY-era Mega Evolution chase cards. */
export const MEGA_EVOLUTION_POOL: StoreItem[] = [
  defineItem("pk-mega-01", "Pancham", "xy3", "Furious Fists", "59", "Common", "Common", 45, 5.0, 0.45),
  defineItem("pk-mega-02", "Pancham", "xy3", "Furious Fists", "60", "https://images.pokemontcg.io/xy3/60_hires.png", "Common", "Common", 50, 4.8, 0.5),
  defineItem("pk-mega-03", "Gulpin", "xy4", "Phantom Forces", "37", "https://images.pokemontcg.io/xy4/37_hires.png", "Common", "Common", 48, 4.8, 0.48),
  defineItem("pk-mega-04", "Deino", "xy4", "Phantom Forces", "72", "https://images.pokemontcg.io/xy4/72_hires.png", "Common", "Common", 52, 4.6, 0.52),
  defineItem("pk-mega-05", "Shuppet", "xy6", "Roaring Skies", "30", "https://images.pokemontcg.io/xy6/30_hires.png", "Common", "Common", 55, 4.6, 0.55),
  defineItem("pk-mega-06", "Banette", "xy6", "Roaring Skies", "31", "https://images.pokemontcg.io/xy6/31_hires.png", "Rare", "Rare", 110, 4, 1.1),
  defineItem("pk-mega-07", "Jirachi", "xy6", "Roaring Skies", "42", "https://images.pokemontcg.io/xy6/42_hires.png", "Rare", "Rare", 125, 3.8, 1.25),
  defineItem("pk-mega-08", "Hawlucha-EX", "xy3", "Furious Fists", "64", "https://images.pokemontcg.io/xy3/64_hires.png", "Rare", "Rare", 140, 3.6, 1.4),
  defineItem("pk-mega-09", "Lucario EX", "xy3", "Furious Fists", "54", "https://images.pokemontcg.io/xy3/54_hires.png", "Epic", "Rare", 240, 3.2, 2.4),
  defineItem("pk-mega-10", "Gengar EX", "xy4", "Phantom Forces", "34", "https://images.pokemontcg.io/xy4/34_hires.png", "Epic", "Rare", 280, 3, 2.8),
  defineItem("pk-mega-11", "Rayquaza EX", "xy6", "Roaring Skies", "75", "https://images.pokemontcg.io/xy6/75_hires.png", "Epic", "Rare", 350, 2.8, 3.5),
  defineItem("pk-mega-12", "Nosepass", "xy5", "Primal Clash", "78", "https://images.pokemontcg.io/xy5/78_hires.png", "Epic", "Rare", 320, 2.8, 3.2),
  defineItem("pk-mega-13", "Forest of Giant Plants", "xy7", "Ancient Origins", "74", "https://images.pokemontcg.io/xy7/74_hires.png", "Legendary", "Rare", 800, 2.4, 8),
  defineItem("pk-mega-14", "Koffing", "xy10", "Fates Collide", "27", "https://images.pokemontcg.io/xy10/27_hires.png", "Legendary", "Rare", 950, 2.2, 9.5),
  defineItem("pk-mega-15", "Bergmite", "xy11", "Steam Siege", "36", "https://images.pokemontcg.io/xy11/36_hires.png", "Legendary", "Rare", 750, 2.4, 7.5),
  defineItem("pk-mega-16", "M Lucario-EX", "xy3", "Furious Fists", "55", "Legendary", "Rare", 1400, 2.0, 14),
  defineItem("pk-mega-17", "M Gengar-EX", "xy4", "Phantom Forces", "35", "https://images.pokemontcg.io/xy4/35_hires.png", "Mythic", "Ancient Rare", 2200, 1.6, 22),
  defineItem("pk-mega-18", "M Rayquaza-EX", "xy6", "Roaring Skies", "76", "https://images.pokemontcg.io/xy6/76_hires.png", "Mythic", "Ancient Rare", 2800, 1.4, 28),
  defineItem("pk-mega-19", "M Alakazam-EX", "xy10", "Fates Collide", "26", "Mythic", "Ancient Rare", 2000, 1.6, 20),
  defineItem("pk-mega-20", "Meditite", "xy5", "Primal Clash", "79", "https://images.pokemontcg.io/xy5/79_hires.png", "Mythic", "Ancient Rare", 1800, 1.8, 18),
  defineItem("pk-mega-21", "Hex Maniac", "xy7", "Ancient Origins", "75", "https://images.pokemontcg.io/xy7/75_hires.png", "Mythic", "Ancient Rare", 1600, 1.8, 16),
  defineItem("pk-mega-22", "Mega Charizard EX", "xy12", "Evolutions", "11", "https://images.pokemontcg.io/xy12/11_hires.png", "Mythic", "Ancient Rare", 3800, 1.2, 38),
  defineItem("pk-mega-23", "M Blastoise-EX", "xy12", "Evolutions", "102", "Mythic", "Ancient Rare", 3200, 1.4, 32),
  defineItem("pk-mega-24", "Sandshrew", "xy12", "Evolutions", "54", "https://images.pokemontcg.io/xy12/54_hires.png", "Mythic", "Ancient Rare", 3000, 1.4, 30),
  defineItem("pk-mega-25", "Rhyperior", "xy5", "Primal Clash", "77", "https://images.pokemontcg.io/xy5/77_hires.png", "Mythic", "Ancient Rare", 4500, 1, 45),
];

/** Prismatic Evolutions — 25 Eeveelution SIR / premium illustration rares. */
export const PRISMATIC_SIR_POOL: StoreItem[] = [
  defineItem("pk-sir-01", "Exeggcute", "sv8pt5", "Prismatic Evolutions", "1", "https://images.pokemontcg.io/sv8pt5/1_hires.png", "Common", "Common", 380, 4.8, 3.8),
  defineItem("pk-sir-02", "Vaporeon", "sv8pt5", "Prismatic Evolutions", "22", "https://images.pokemontcg.io/sv8pt5/22_hires.png", "Common", "Common", 420, 4.6, 4.2),
  defineItem("pk-sir-03", "Jolteon", "sv8pt5", "Prismatic Evolutions", "29", "https://images.pokemontcg.io/sv8pt5/29_hires.png", "Common", "Common", 420, 4.6, 4.2),
  defineItem("pk-sir-04", "Flareon", "sv8pt5", "Prismatic Evolutions", "13", "https://images.pokemontcg.io/sv8pt5/13_hires.png", "Common", "Common", 400, 4.6, 4),
  defineItem("pk-sir-05", "Espeon", "sv8pt5", "Prismatic Evolutions", "33", "https://images.pokemontcg.io/sv8pt5/33_hires.png", "Rare", "Rare", 1000, 4, 10),
  defineItem("pk-sir-06", "Umbreon", "sv8pt5", "Prismatic Evolutions", "59", "https://images.pokemontcg.io/sv8pt5/59_hires.png", "Rare", "Rare", 1150, 3.8, 11.5),
  defineItem("pk-sir-07", "Sylveon", "sv8pt5", "Prismatic Evolutions", "40", "https://images.pokemontcg.io/sv8pt5/40_hires.png", "Rare", "Rare", 1100, 3.8, 11),
  defineItem("pk-sir-08", "Glaceon", "sv8pt5", "Prismatic Evolutions", "25", "https://images.pokemontcg.io/sv8pt5/25_hires.png", "Rare", "Rare", 1050, 3.8, 10.5),
  defineItem("pk-sir-09", "Fezandipiti", "sv8pt5", "Prismatic Evolutions", "45", "https://images.pokemontcg.io/sv8pt5/45_hires.png", "Rare", "Rare", 1120, 3.8, 11.2),
  defineItem("pk-sir-10", "Eevee ex", "sv8pt5", "Prismatic Evolutions", "74", "https://images.pokemontcg.io/sv8pt5/74_hires.png", "Epic", "Rare", 2200, 3.2, 22),
  defineItem("pk-sir-11", "Hawlucha", "sv8pt5", "Prismatic Evolutions", "89", "https://images.pokemontcg.io/sv8pt5/89_hires.png", "Epic", "Rare", 2450, 3, 24.5),
  defineItem("pk-sir-12", "Area Zero Underdepths", "sv8pt5", "Prismatic Evolutions", "94", "https://images.pokemontcg.io/sv8pt5/94_hires.png", "Epic", "Rare", 2350, 3, 23.5),
  defineItem("pk-sir-13", "Lopunny", "sv8pt5", "Prismatic Evolutions", "84", "https://images.pokemontcg.io/sv8pt5/84_hires.png", "Epic", "Rare", 2300, 3, 23),
  defineItem("pk-sir-14", "Black Belt's Training", "sv8pt5", "Prismatic Evolutions", "99", "https://images.pokemontcg.io/sv8pt5/99_hires.png", "Legendary", "Rare", 3400, 2.4, 34),
  defineItem("pk-sir-15", "Umbreon ex", "sv8pt5", "Prismatic Evolutions", "161", "https://images.pokemontcg.io/sv8pt5/161_hires.png", "Legendary", "Rare", 3800, 2.2, 38),
  defineItem("pk-sir-16", "Friends in Paldea", "sv8pt5", "Prismatic Evolutions", "109", "https://images.pokemontcg.io/sv8pt5/109_hires.png", "Legendary", "Rare", 3200, 2.4, 32),
  defineItem("pk-sir-17", "Lacey", "sv8pt5", "Prismatic Evolutions", "114", "https://images.pokemontcg.io/sv8pt5/114_hires.png", "Legendary", "Rare", 3100, 2.4, 31),
  defineItem("pk-sir-18", "Prime Catcher", "sv8pt5", "Prismatic Evolutions", "119", "https://images.pokemontcg.io/sv8pt5/119_hires.png", "Legendary", "Rare", 3500, 2.2, 35),
  defineItem("pk-sir-19", "Terapagos ex SIR", "sv8pt5", "Prismatic Evolutions", "169", "https://images.pokemontcg.io/sv8pt5/169_hires.png", "Mythic", "Ancient Rare", 158000, 1.6, 1580),
  defineItem("pk-sir-20", "Vaporeon ex SIR", "sv8pt5", "Prismatic Evolutions", "149", "https://images.pokemontcg.io/sv8pt5/149_hires.png", "Mythic", "Ancient Rare", 7800, 1.4, 78),
  defineItem("pk-sir-21", "Iron Hands ex SIR", "sv8pt5", "Prismatic Evolutions", "154", "https://images.pokemontcg.io/sv8pt5/154_hires.png", "Mythic", "Ancient Rare", 7400, 1.4, 74),
  defineItem("pk-sir-22", "Sandy Shocks ex SIR", "sv8pt5", "Prismatic Evolutions", "159", "https://images.pokemontcg.io/sv8pt5/159_hires.png", "Mythic", "Ancient Rare", 7200, 1.4, 72),
  defineItem("pk-sir-23", "Gholdengo ex SIR", "sv8pt5", "Prismatic Evolutions", "164", "https://images.pokemontcg.io/sv8pt5/164_hires.png", "Mythic", "Ancient Rare", 9500, 1.2, 95),
  defineItem("pk-sir-24", "Terapagos ex SIR", "sv8pt5", "Prismatic Evolutions", "169", "https://images.pokemontcg.io/sv8pt5/169_hires.png", "Mythic", "Ancient Rare", 158000, 1, 1580),
  defineItem("pk-sir-25", "Kieran SIR", "sv8pt5", "Prismatic Evolutions", "174", "https://images.pokemontcg.io/sv8pt5/174_hires.png", "Mythic", "Ancient Rare", 10500, 1.2, 105),
];

/** Evolving Skies Chase — 25 alternate-art grail chase cards from swsh7. */
export const EVOLVING_SKIES_POOL: StoreItem[] = [
  defineItem("pk-es-01", "Eevee", "swsh7", "Evolving Skies", "125", "https://images.pokemontcg.io/swsh7/125_hires.png", "Common", "Common", 160, 4.6, 1.6),
  defineItem("pk-es-02", "Teddiursa", "swsh7", "Evolving Skies", "126", "https://images.pokemontcg.io/swsh7/126_hires.png", "Common", "Common", 150, 4.6, 1.5),
  defineItem("pk-es-03", "Lilligant", "swsh7", "Evolving Skies", "10", "https://images.pokemontcg.io/swsh7/10_hires.png", "Common", "Common", 145, 4.8, 1.45),
  defineItem("pk-es-04", "Dwebble", "swsh7", "Evolving Skies", "11", "https://images.pokemontcg.io/swsh7/11_hires.png", "Common", "Common", 140, 4.8, 1.4),
  defineItem("pk-es-05", "Gossifleur", "swsh7", "Evolving Skies", "15", "https://images.pokemontcg.io/swsh7/15_hires.png", "Common", "Common", 142, 4.8, 1.42),
  defineItem("pk-es-06", "Flareon VMAX", "swsh7", "Evolving Skies", "18", "https://images.pokemontcg.io/swsh7/18_hires.png", "Rare", "Rare", 350, 3.6, 3.5),
  defineItem("pk-es-07", "Litleo", "swsh7", "Evolving Skies", "22", "https://images.pokemontcg.io/swsh7/22_hires.png", "Rare", "Rare", 360, 3.6, 3.6),
  defineItem("pk-es-08", "Gyarados V", "swsh7", "Evolving Skies", "28", "https://images.pokemontcg.io/swsh7/28_hires.png", "Rare", "Rare", 355, 3.6, 3.55),
  defineItem("pk-es-09", "Carvanha", "swsh7", "Evolving Skies", "35", "https://images.pokemontcg.io/swsh7/35_hires.png", "Epic", "Rare", 750, 3, 7.5),
  defineItem("pk-es-10", "Umbreon V", "swsh7", "Evolving Skies", "94", "https://images.pokemontcg.io/swsh7/94_hires.png", "Epic", "Rare", 850, 2.8, 8.5),
  defineItem("pk-es-11", "Leafeon V", "swsh7", "Evolving Skies", "7", "Epic", "Rare", 700, 3.0, 7),
  defineItem("pk-es-12", "Glaceon V", "swsh7", "Evolving Skies", "40", "https://images.pokemontcg.io/swsh7/40_hires.png", "Epic", "Rare", 680, 3, 6.8),
  defineItem("pk-es-13", "Sylveon V", "swsh7", "Evolving Skies", "74", "https://images.pokemontcg.io/swsh7/74_hires.png", "Epic", "Rare", 720, 3, 7.2),
  defineItem("pk-es-14", "Dragonite V", "swsh7", "Evolving Skies", "192", "https://images.pokemontcg.io/swsh7/192_hires.png", "Legendary", "Rare", 1800, 2.2, 18),
  defineItem("pk-es-15", "Rayquaza V", "swsh7", "Evolving Skies", "110", "https://images.pokemontcg.io/swsh7/110_hires.png", "Legendary", "Rare", 2000, 2, 20),
  defineItem("pk-es-16", "Duraludon VMAX", "swsh7", "Evolving Skies", "123", "https://images.pokemontcg.io/swsh7/123_hires.png", "Legendary", "Rare", 1600, 2.2, 16),
  defineItem("pk-es-17", "Leafeon VMAX", "swsh7", "Evolving Skies", "205", "https://images.pokemontcg.io/swsh7/205_hires.png", "Mythic", "Ancient Rare", 4200, 1.4, 42),
  defineItem("pk-es-18", "Glaceon VMAX", "swsh7", "Evolving Skies", "209", "https://images.pokemontcg.io/swsh7/209_hires.png", "Mythic", "Ancient Rare", 4000, 1.4, 40),
  defineItem("pk-es-19", "Sylveon VMAX", "swsh7", "Evolving Skies", "212", "https://images.pokemontcg.io/swsh7/212_hires.png", "Mythic", "Ancient Rare", 4500, 1.2, 45),
  defineItem("pk-es-20", "Rayquaza VMAX", "swsh7", "Evolving Skies", "217", "https://images.pokemontcg.io/swsh7/217_hires.png", "Mythic", "Ancient Rare", 5500, 1, 55),
  defineItem("pk-es-21", "Umbreon VMAX", "swsh7", "Evolving Skies", "215", "https://images.pokemontcg.io/swsh7/215_hires.png", "Mythic", "Ancient Rare", 195000, 0.8, 1950),
  defineItem("pk-es-22", "Rayquaza V Alt Art", "swsh7", "Evolving Skies", "193", "https://images.pokemontcg.io/swsh7/193_hires.png", "Mythic", "Ancient Rare", 4800, 1.2, 48),
  defineItem("pk-es-23", "Rayquaza VMAX Alt Art", "swsh7", "Evolving Skies", "111", "https://images.pokemontcg.io/swsh7/111_hires.png", "Mythic", "Ancient Rare", 62000, 1, 620),
  defineItem("pk-es-24", "Umbreon V Alt Art", "swsh7", "Evolving Skies", "189", "https://images.pokemontcg.io/swsh7/189_hires.png", "Mythic", "Ancient Rare", 28500, 0.8, 285),
  defineItem("pk-es-25", "Rayquaza VMAX Alt Art", "swsh7", "Evolving Skies", "218", "https://images.pokemontcg.io/swsh7/218_hires.png", "Mythic", "Ancient Rare", 58000, 0.6, 580),
];

/** WOTC 1st Edition Classic — 25 vintage 1999–2000 first edition holos only. */
export const WOTC_FIRST_EDITION_POOL: StoreItem[] = [
  defineItem("pk-wotc-01", "Machop 1st Ed", "base1", "Base Set 1st Ed", "52", "https://images.pokemontcg.io/base1/52_hires.png", "Rare", "Rare", 2800, 5, 28),
  defineItem("pk-wotc-02", "Magikarp 1st Ed", "base1", "Base Set 1st Ed", "35", "https://images.pokemontcg.io/base1/35_hires.png", "Rare", "Rare", 2500, 5.2, 25),
  defineItem("pk-wotc-03", "Poliwhirl 1st Ed", "base1", "Base Set 1st Ed", "38", "https://images.pokemontcg.io/base1/38_hires.png", "Rare", "Rare", 2600, 5, 26),
  defineItem("pk-wotc-04", "Kakuna 1st Ed", "base1", "Base Set 1st Ed", "33", "https://images.pokemontcg.io/base1/33_hires.png", "Rare", "Rare", 2550, 5, 25.5),
  defineItem("pk-wotc-05", "Growlithe 1st Ed", "base1", "Base Set 1st Ed", "28", "https://images.pokemontcg.io/base1/28_hires.png", "Rare", "Rare", 2400, 5.2, 24),
  defineItem("pk-wotc-06", "Machoke 1st Ed", "base1", "Base Set 1st Ed", "34", "https://images.pokemontcg.io/base1/34_hires.png", "Epic", "Rare", 4800, 4.2, 48),
  defineItem("pk-wotc-07", "Magneton 1st Ed", "base1", "Base Set 1st Ed", "9", "https://images.pokemontcg.io/base1/9_hires.png", "Epic", "Rare", 5200, 4, 52),
  defineItem("pk-wotc-08", "Raichu 1st Ed", "base1", "Base Set 1st Ed", "14", "https://images.pokemontcg.io/base1/14_hires.png", "Epic", "Rare", 6200, 3.8, 62),
  defineItem("pk-wotc-09", "Ninetales 1st Ed Holo", "base1", "Base Set 1st Ed", "12", "https://images.pokemontcg.io/base1/12_hires.png", "Legendary", "Rare", 13000, 2.8, 130),
  defineItem("pk-wotc-10", "Poliwrath 1st Ed Holo", "base1", "Base Set 1st Ed", "13", "https://images.pokemontcg.io/base1/13_hires.png", "Legendary", "Rare", 12500, 2.8, 125),
  defineItem("pk-wotc-11", "Clefairy 1st Ed Holo", "base1", "Base Set 1st Ed", "5", "https://images.pokemontcg.io/base1/5_hires.png", "Legendary", "Rare", 16000, 2.4, 160),
  defineItem("pk-wotc-12", "Nidoking 1st Ed Holo", "base1", "Base Set 1st Ed", "11", "https://images.pokemontcg.io/base1/11_hires.png", "Legendary", "Rare", 17500, 2.2, 175),
  defineItem("pk-wotc-13", "Gyarados 1st Ed Holo", "base1", "Base Set 1st Ed", "6", "https://images.pokemontcg.io/base1/6_hires.png", "Mythic", "Ancient Rare", 31000, 1.6, 310),
  defineItem("pk-wotc-14", "Alakazam 1st Ed Holo", "base1", "Base Set 1st Ed", "1", "https://images.pokemontcg.io/base1/1_hires.png", "Mythic", "Ancient Rare", 36000, 1.4, 360),
  defineItem("pk-wotc-15", "Machamp 1st Ed Holo", "base1", "Base Set 1st Ed", "8", "https://images.pokemontcg.io/base1/8_hires.png", "Mythic", "Ancient Rare", 28500, 1.6, 285),
  defineItem("pk-wotc-16", "Zapdos 1st Ed Holo", "base1", "Base Set 1st Ed", "16", "https://images.pokemontcg.io/base1/16_hires.png", "Mythic", "Ancient Rare", 39000, 1.2, 390),
  defineItem("pk-wotc-17", "Mewtwo 1st Ed Holo", "base1", "Base Set 1st Ed", "10", "https://images.pokemontcg.io/base1/10_hires.png", "Mythic", "Ancient Rare", 49000, 1, 490),
  defineItem("pk-wotc-18", "Venusaur 1st Ed Holo", "base1", "Base Set 1st Ed", "15", "https://images.pokemontcg.io/base1/15_hires.png", "Mythic", "Ancient Rare", 65000, 0.8, 650),
  defineItem("pk-wotc-19", "Blastoise 1st Ed Holo", "base1", "Base Set 1st Ed", "2", "https://images.pokemontcg.io/base1/2_hires.png", "Mythic", "Ancient Rare", 72000, 0.7, 720),
  defineItem("pk-wotc-20", "Charizard 1st Ed Holo", "base1", "Base Set 1st Ed", "4", "https://images.pokemontcg.io/base1/4_hires.png", "Mythic", "Ancient Rare", 380000, 0.4, 3800),
  defineItem("pk-wotc-21", "Chansey 1st Ed Holo", "base1", "Base Set 1st Ed", "3", "https://images.pokemontcg.io/base1/3_hires.png", "Mythic", "Ancient Rare", 42000, 1.2, 420),
  defineItem("pk-wotc-22", "Hitmonchan 1st Ed Holo", "base1", "Base Set 1st Ed", "7", "https://images.pokemontcg.io/base1/7_hires.png", "Mythic", "Ancient Rare", 36000, 1.4, 360),
  defineItem("pk-wotc-23", "Jungle 1st Ed Snorlax Holo", "base2", "Jungle 1st Ed", "27", "https://images.pokemontcg.io/base2/27_hires.png", "Mythic", "Ancient Rare", 31000, 1.6, 310),
  defineItem("pk-wotc-24", "Fossil 1st Ed Gengar Holo", "base3", "Fossil 1st Ed", "5", "https://images.pokemontcg.io/base3/5_hires.png", "Mythic", "Ancient Rare", 44000, 1.2, 440),
  defineItem("pk-wotc-25", "Charizard 1st Ed Holo — PSA 9", "base1", "Base Set 1st Ed", "4", "https://images.pokemontcg.io/base1/4_hires.png", "Mythic", "Ancient Rare", 2450000, 0.3, 24500),
];

/** The Obsidian Vault — vintage + modern grail chase placeholders. */
export const OBSIDIAN_VAULT_POOL: StoreItem[] = [
  defineItem("pk-obs-01", "Charizard Holo", "base1", "Base Set", "4", "https://images.pokemontcg.io/base1/4_hires.png", "Mythic", "Ancient Rare", 55000, 2, 550),
  defineItem("pk-obs-02", "Mawile", "ex16", "Unseen Forces", "17", "https://images.pokemontcg.io/ex16/17_hires.png", "Mythic", "Ancient Rare", 250000, 2.2, 2500),
  defineItem("pk-obs-03", "Mewtwo Holo", "base1", "Base Set", "10", "https://images.pokemontcg.io/base1/10_hires.png", "Mythic", "Ancient Rare", 22000, 3, 220),
  defineItem("pk-obs-04", "Lugia V Alt Art", "swsh12", "Silver Tempest", "186", "https://images.pokemontcg.io/swsh12/186_hires.png", "Mythic", "Ancient Rare", 38000, 2.6, 380),
  defineItem("pk-obs-05", "Giratina V Alt Art", "swsh11", "Lost Origin", "186", "https://images.pokemontcg.io/swsh11/186_hires.png", "Mythic", "Ancient Rare", 48000, 2.4, 480),
];

/** The PSA 10 Chaser — gem-mint modern chase slabs. */
export const PSA_10_CHASER_POOL: StoreItem[] = [
  defineItem("pk-psa-01", "Charizard ex — PSA 10", "sv3", "Obsidian Flames", "223", "https://images.pokemontcg.io/sv3/223_hires.png", "Mythic", "Ancient Rare", 28000, 2.4, 280),
  defineItem("pk-psa-02", "Umbreon VMAX Alt — PSA 10", "swsh7", "Evolving Skies", "215", "https://images.pokemontcg.io/swsh7/215_hires.png", "Mythic", "Ancient Rare", 435000, 1.8, 4350),
  defineItem("pk-psa-03", "Pikachu VMAX — PSA 10", "swsh4", "Vivid Voltage", "188", "https://images.pokemontcg.io/swsh4/188_hires.png", "Legendary", "Rare", 48000, 3.2, 480),
  defineItem("pk-psa-04", "Iono — PSA 10", "sv2", "Paldea Evolved", "269", "https://images.pokemontcg.io/sv2/269_hires.png", "Mythic", "Ancient Rare", 65000, 2.6, 650),
  defineItem("pk-psa-05", "Mew ex — PSA 10", "sv3pt5", "151", "205", "https://images.pokemontcg.io/sv3pt5/205_hires.png", "Mythic", "Ancient Rare", 95000, 2, 950),
];

/** Trainer Gallery — supporter full-art chase pool. */
export const WAIFU_VAULT_POOL: StoreItem[] = [
  defineItem("pk-waifu-01", "Lillie Full Art", "sm1", "Sun & Moon", "147", "https://images.pokemontcg.io/sm1/147_hires.png", "Mythic", "Ancient Rare", 12000, 2.8, 120),
  defineItem("pk-waifu-02", "Iono Full Art", "sv2", "Paldea Evolved", "269", "https://images.pokemontcg.io/sv2/269_hires.png", "Mythic", "Ancient Rare", 6800, 2.6, 68),
  defineItem("pk-waifu-03", "Miriam Full Art", "sv1", "Scarlet & Violet", "251", "https://images.pokemontcg.io/sv1/251_hires.png", "Legendary", "Rare", 3200, 3.6, 32),
  defineItem("pk-waifu-04", "Acerola Full Art", "sm3", "Burning Shadows", "142", "https://images.pokemontcg.io/sm3/142_hires.png", "Legendary", "Rare", 2800, 4, 28),
  defineItem("pk-waifu-05", "Iron Treads ex Full Art", "sv1", "Scarlet & Violet", "248", "https://images.pokemontcg.io/sv1/248_hires.png", "Epic", "Rare", 1800, 4.8, 18),
];

/** The Shiny Vault — Hidden Fates shiny vault hits. */
export const SHINY_VAULT_POOL: StoreItem[] = [
  defineItem("pk-shiny-01", "Shiny Charizard GX", "sma", "Hidden Fates Shiny Vault", "SV49", "https://images.pokemontcg.io/sma/SV49_hires.png", "Mythic", "Ancient Rare", 7200, 2.4, 72),
  defineItem("pk-shiny-02", "Shiny Mewtwo GX", "sma", "Hidden Fates Shiny Vault", "SV59", "https://images.pokemontcg.io/sma/SV59_hires.png", "Mythic", "Ancient Rare", 5800, 2.6, 58),
  defineItem("pk-shiny-03", "Electrode-GX", "sma", "Hidden Fates Shiny Vault", "SV57", "https://images.pokemontcg.io/sma/SV57_hires.png", "Legendary", "Rare", 4200, 3, 42),
  defineItem("pk-shiny-04", "Gabite", "sma", "Hidden Fates Shiny Vault", "SV39", "https://images.pokemontcg.io/sma/SV39_hires.png", "Legendary", "Rare", 3400, 3.4, 34),
  defineItem("pk-shiny-05", "Eevee", "sma", "Hidden Fates Shiny Vault", "SV41", "https://images.pokemontcg.io/sma/SV41_hires.png", "Epic", "Rare", 2600, 3.8, 26),
];

/** Power Hour — exclusive electric/lightning chase pool (Surging Sparks + electric grails). */
export const POWER_HOUR_POOL: StoreItem[] = [
  defineItem("pk-ph-01", "Pawmi", "sv1", "Scarlet & Violet", "74", "https://images.pokemontcg.io/sv1/74_hires.png", "Common", "Common", 12, 5.2, 0.12),
  defineItem("pk-ph-02", "Wattrel", "sv1", "Scarlet & Violet", "78", "https://images.pokemontcg.io/sv1/78_hires.png", "Common", "Common", 10, 5.2, 0.1),
  defineItem("pk-ph-03", "Tadbulb", "sv2", "Paldea Evolved", "78", "https://images.pokemontcg.io/sv2/78_hires.png", "Common", "Common", 11, 5, 0.11),
  defineItem("pk-ph-04", "Flittle", "sv8", "Surging Sparks", "94", "https://images.pokemontcg.io/sv8/94_hires.png", "Common", "Common", 18, 5, 0.18),
  defineItem("pk-ph-05", "Miraidon", "sv8", "Surging Sparks", "69", "https://images.pokemontcg.io/sv8/69_hires.png", "Common", "Common", 14, 5, 0.14),
  defineItem("pk-ph-06", "Stantler", "swsh8", "Fusion Strike", "208", "https://images.pokemontcg.io/swsh8/208_hires.png", "Rare", "Rare", 35, 3.8, 0.35),
  defineItem("pk-ph-07", "Togepi", "sv8", "Surging Sparks", "70", "https://images.pokemontcg.io/sv8/70_hires.png", "Rare", "Rare", 22, 3.8, 0.22),
  defineItem("pk-ph-08", "Cetoddle", "sv8", "Surging Sparks", "53", "https://images.pokemontcg.io/sv8/53_hires.png", "Rare", "Rare", 88, 3.6, 0.88),
  defineItem("pk-ph-09", "Aegislash", "sv4", "Paradox Rift", "134", "https://images.pokemontcg.io/sv4/134_hires.png", "Rare", "Rare", 165, 3.4, 1.65),
  defineItem("pk-ph-10", "Latios", "sv8", "Surging Sparks", "203", "https://images.pokemontcg.io/sv8/203_hires.png", "Rare", "Rare", 180, 3.2, 1.8),
  defineItem("pk-ph-11", "Pikachu ex", "sv8", "Surging Sparks", "57", "https://images.pokemontcg.io/sv8/57_hires.png", "Epic", "Rare", 372, 3, 3.72),
  defineItem("pk-ph-12", "Kilowattrel ex", "sv1", "Scarlet & Violet", "79", "https://images.pokemontcg.io/sv1/79_hires.png", "Epic", "Rare", 220, 2.8, 2.2),
  defineItem("pk-ph-13", "Flygon ex", "sv8", "Surging Sparks", "222", "https://images.pokemontcg.io/sv8/222_hires.png", "Epic", "Rare", 320, 2.6, 3.2),
  defineItem("pk-ph-14", "Wash Water Energy", "swsh4", "Vivid Voltage", "165", "https://images.pokemontcg.io/swsh4/165_hires.png", "Epic", "Rare", 340, 2.6, 3.4),
  defineItem("pk-ph-15", "Cyclizar ex", "sv8", "Surging Sparks", "228", "https://images.pokemontcg.io/sv8/228_hires.png", "Epic", "Rare", 650, 2.4, 6.5),
  defineItem("pk-ph-16", "Black Kyurem ex", "sv8", "Surging Sparks", "218", "https://images.pokemontcg.io/sv8/218_hires.png", "Legendary", "Rare", 820, 2.2, 8.2),
  defineItem("pk-ph-17", "Pikachu ex", "sv8", "Surging Sparks", "219", "https://images.pokemontcg.io/sv8/219_hires.png", "Legendary", "Rare", 2600, 2, 26),
  defineItem("pk-ph-18", "Palossand ex", "sv8", "Surging Sparks", "221", "https://images.pokemontcg.io/sv8/221_hires.png", "Legendary", "Rare", 1400, 2, 14),
  defineItem("pk-ph-19", "Milotic ex", "sv8", "Surging Sparks", "217", "https://images.pokemontcg.io/sv8/217_hires.png", "Legendary", "Rare", 1200, 2.2, 12),
  defineItem("pk-ph-20", "Durant ex", "sv8", "Surging Sparks", "236", "https://images.pokemontcg.io/sv8/236_hires.png", "Legendary", "Rare", 950, 2.2, 9.5),
  defineItem("pk-ph-21", "Hydreigon ex", "sv8", "Surging Sparks", "240", "https://images.pokemontcg.io/sv8/240_hires.png", "Mythic", "Ancient Rare", 2200, 1.6, 22),
  defineItem("pk-ph-22", "Archaludon ex", "sv8", "Surging Sparks", "241", "https://images.pokemontcg.io/sv8/241_hires.png", "Mythic", "Ancient Rare", 1800, 1.6, 18),
  defineItem("pk-ph-23", "Pikachu ex", "sv8", "Surging Sparks", "247", "https://images.pokemontcg.io/sv8/247_hires.png", "Mythic", "Ancient Rare", 7140, 1.2, 71.4),
  defineItem("pk-ph-24", "Alolan Exeggutor ex", "sv8", "Surging Sparks", "248", "https://images.pokemontcg.io/sv8/248_hires.png", "Mythic", "Ancient Rare", 4500, 1.4, 45),
  defineItem("pk-ph-25", "Pikachu ex", "sv8", "Surging Sparks", "238", "https://images.pokemontcg.io/sv8/238_hires.png", "Mythic", "Ancient Rare", 25800, 1, 258),
];

/** Midnight Grail — exclusive dark, ghost, and vintage night grails. */
export const MIDNIGHT_GRAIL_POOL: StoreItem[] = [
  defineItem("pk-mg-01", "Palafin ex", "sv6", "Twilight Masquerade", "193", "https://images.pokemontcg.io/sv6/193_hires.png", "Rare", "Rare", 1500, 4.8, 15),
  defineItem("pk-mg-02", "Aegislash ex", "sv4", "Paradox Rift", "135", "https://images.pokemontcg.io/sv4/135_hires.png", "Rare", "Rare", 1200, 5, 12),
  defineItem("pk-mg-03", "Honchkrow", "dp2", "Paradox Rift", "10", "https://images.pokemontcg.io/dp2/10_hires.png", "Rare", "Rare", 1100, 5, 11),
  defineItem("pk-mg-04", "Darkrai V", "swsh10", "Astral Radiance", "98", "https://images.pokemontcg.io/swsh10/98_hires.png", "Rare", "Rare", 1800, 4.6, 18),
  defineItem("pk-mg-05", "Haunter Holo", "base3", "Fossil", "6", "https://images.pokemontcg.io/base3/6_hires.png", "Epic", "Rare", 3800, 3.6, 38),
  defineItem("pk-mg-06", "Garganacl", "sv4", "Paradox Rift", "104", "https://images.pokemontcg.io/sv4/104_hires.png", "Epic", "Rare", 1200, 3.4, 12),
  defineItem("pk-mg-07", "Slaking", "sv2", "Paldea Evolved", "162", "https://images.pokemontcg.io/sv2/162_hires.png", "Epic", "Rare", 1800, 3.2, 18),
  defineItem("pk-mg-08", "Dark Hypno", "base5", "Team Rocket", "9", "https://images.pokemontcg.io/base5/9_hires.png", "Epic", "Rare", 4200, 3, 42),
  defineItem("pk-mg-09", "Dark Weezing", "base5", "Team Rocket", "31", "https://images.pokemontcg.io/base5/31_hires.png", "Epic", "Rare", 3800, 3.2, 38),
  defineItem("pk-mg-10", "Gengar Holo", "base3", "Fossil", "5", "https://images.pokemontcg.io/base3/5_hires.png", "Legendary", "Rare", 9500, 2.6, 95),
  defineItem("pk-mg-11", "Forretress ex", "sv2", "Paldea Evolved", "230", "https://images.pokemontcg.io/sv2/230_hires.png", "Legendary", "Rare", 2800, 2.8, 28),
  defineItem("pk-mg-12", "Iron Thorns ex", "sv6", "Twilight Masquerade", "196", "https://images.pokemontcg.io/sv6/196_hires.png", "Legendary", "Rare", 2400, 2.8, 24),
  defineItem("pk-mg-13", "Umbreon V", "swsh9tg", "Brilliant Stars Trainer Gallery", "TG22", "https://images.pokemontcg.io/swsh9tg/TG22_hires.png", "Legendary", "Rare", 3500, 2.6, 35),
  defineItem("pk-mg-14", "Pokémon League Headquarters", "sv3", "Obsidian Flames", "192", "https://images.pokemontcg.io/sv3/192_hires.png", "Legendary", "Rare", 2200, 2.8, 22),
  defineItem("pk-mg-15", "Dark Machamp", "base5", "Team Rocket", "10", "https://images.pokemontcg.io/base5/10_hires.png", "Legendary", "Rare", 5500, 2.4, 55),
  defineItem("pk-mg-16", "Dark Gyarados", "base5", "Team Rocket", "8", "https://images.pokemontcg.io/base5/8_hires.png", "Legendary", "Rare", 12000, 2, 120),
  defineItem("pk-mg-17", "Meganium Holo", "neo1", "Neo Genesis", "11", "https://images.pokemontcg.io/neo1/11_hires.png", "Legendary", "Rare", 5500, 2.4, 55),
  defineItem("pk-mg-18", "Gengar ex", "sv5", "Temporal Forces", "193", "https://images.pokemontcg.io/sv5/193_hires.png", "Mythic", "Ancient Rare", 6800, 1.4, 68),
  defineItem("pk-mg-19", "Choy", "swsh10", "Astral Radiance", "182", "https://images.pokemontcg.io/swsh10/182_hires.png", "Mythic", "Ancient Rare", 4200, 1.6, 42),
  defineItem("pk-mg-20", "Buddy-Buddy Poffin", "sv6", "Twilight Masquerade", "223", "https://images.pokemontcg.io/sv6/223_hires.png", "Mythic", "Ancient Rare", 3800, 1.6, 38),
  defineItem("pk-mg-21", "Perrin", "sv6", "Twilight Masquerade", "220", "https://images.pokemontcg.io/sv6/220_hires.png", "Mythic", "Ancient Rare", 3200, 1.8, 32),
  defineItem("pk-mg-22", "Teal Mask Ogerpon ex", "sv6", "Twilight Masquerade", "221", "https://images.pokemontcg.io/sv6/221_hires.png", "Mythic", "Ancient Rare", 3000, 1.8, 30),
  defineItem("pk-mg-23", "Lana's Aid", "sv6", "Twilight Masquerade", "219", "https://images.pokemontcg.io/sv6/219_hires.png", "Mythic", "Ancient Rare", 2800, 1.8, 28),
  defineItem("pk-mg-24", "Gengar VMAX", "swsh8", "Fusion Strike", "271", "Mythic", "Ancient Rare", 17500, 1.0, 175),
  defineItem("pk-mg-25", "Dark Dragonite", "base5", "Team Rocket", "5", "https://images.pokemontcg.io/base5/5_hires.png", "Mythic", "Ancient Rare", 28000, 0.8, 280),
];

/** Flash Pack — exclusive modern illustration-rare and hot chase hits. */
export const FLASH_POOL: StoreItem[] = [
  defineItem("pk-fl-01", "Greavard", "sv7", "Stellar Crown", "70", "https://images.pokemontcg.io/sv7/70_hires.png", "Common", "Common", 15, 5, 0.15),
  defineItem("pk-fl-02", "Meditite", "sv7", "Stellar Crown", "77", "https://images.pokemontcg.io/sv7/77_hires.png", "Common", "Common", 10, 5.2, 0.1),
  defineItem("pk-fl-03", "Rapidash", "sv7", "Stellar Crown", "20", "https://images.pokemontcg.io/sv7/20_hires.png", "Common", "Common", 8, 5.2, 0.08),
  defineItem("pk-fl-04", "Amulet of Hope", "sv8", "Surging Sparks", "162", "https://images.pokemontcg.io/sv8/162_hires.png", "Common", "Common", 12, 5, 0.12),
  defineItem("pk-fl-05", "Flapple", "sv8", "Surging Sparks", "210", "https://images.pokemontcg.io/sv8/210_hires.png", "Rare", "Rare", 35, 4, 0.35),
  defineItem("pk-fl-06", "Clobbopus", "sv8", "Surging Sparks", "207", "https://images.pokemontcg.io/sv8/207_hires.png", "Rare", "Rare", 55, 3.8, 0.55),
  defineItem("pk-fl-07", "Cetitan", "sv8", "Surging Sparks", "201", "https://images.pokemontcg.io/sv8/201_hires.png", "Rare", "Rare", 45, 3.8, 0.45),
  defineItem("pk-fl-08", "Feebas", "sv8", "Surging Sparks", "198", "https://images.pokemontcg.io/sv8/198_hires.png", "Rare", "Rare", 40, 4, 0.4),
  defineItem("pk-fl-09", "Phanpy", "sv8", "Surging Sparks", "205", "https://images.pokemontcg.io/sv8/205_hires.png", "Rare", "Rare", 38, 4, 0.38),
  defineItem("pk-fl-10", "Gulpin", "sv7", "Stellar Crown", "91", "https://images.pokemontcg.io/sv7/91_hires.png", "Rare", "Rare", 42, 3.8, 0.42),
  defineItem("pk-fl-11", "Gardevoir ex", "sv1", "Scarlet & Violet", "245", "https://images.pokemontcg.io/sv1/245_hires.png", "Epic", "Rare", 1400, 3.2, 14),
  defineItem("pk-fl-12", "Greedent ex", "sv3", "Obsidian Flames", "179", "https://images.pokemontcg.io/sv3/179_hires.png", "Epic", "Rare", 800, 3.4, 8),
  defineItem("pk-fl-13", "Archaludon ex", "sv8", "Surging Sparks", "224", "https://images.pokemontcg.io/sv8/224_hires.png", "Epic", "Rare", 600, 3.2, 6),
  defineItem("pk-fl-14", "Appletun", "sv8", "Surging Sparks", "211", "https://images.pokemontcg.io/sv8/211_hires.png", "Epic", "Rare", 500, 3.4, 5),
  defineItem("pk-fl-15", "Kecleon", "sv8", "Surging Sparks", "213", "https://images.pokemontcg.io/sv8/213_hires.png", "Epic", "Rare", 800, 3.2, 8),
  defineItem("pk-fl-16", "Mesprit", "sv8", "Surging Sparks", "204", "https://images.pokemontcg.io/sv8/204_hires.png", "Epic", "Rare", 850, 3, 8.5),
  defineItem("pk-fl-17", "Milotic ex", "sv8", "Surging Sparks", "237", "https://images.pokemontcg.io/sv8/237_hires.png", "Legendary", "Rare", 1500, 2.4, 15),
  defineItem("pk-fl-18", "Latias ex", "sv8", "Surging Sparks", "239", "https://images.pokemontcg.io/sv8/239_hires.png", "Legendary", "Rare", 1800, 2.2, 18),
  defineItem("pk-fl-19", "Alolan Exeggutor ex", "sv8", "Surging Sparks", "242", "https://images.pokemontcg.io/sv8/242_hires.png", "Legendary", "Rare", 1600, 2.4, 16),
  defineItem("pk-fl-20", "Tatsugiri ex", "sv8", "Surging Sparks", "226", "https://images.pokemontcg.io/sv8/226_hires.png", "Legendary", "Rare", 1200, 2.6, 12),
  defineItem("pk-fl-21", "Counter Gain", "sv8", "Surging Sparks", "169", "https://images.pokemontcg.io/sv8/169_hires.png", "Mythic", "Ancient Rare", 4200, 1.6, 42),
  defineItem("pk-fl-22", "Dachsbun ex", "sv7", "Stellar Crown", "169", "https://images.pokemontcg.io/sv7/169_hires.png", "Mythic", "Ancient Rare", 2800, 1.8, 28),
  defineItem("pk-fl-23", "Jasmine's Gaze", "sv8", "Surging Sparks", "245", "https://images.pokemontcg.io/sv8/245_hires.png", "Mythic", "Ancient Rare", 2800, 1.8, 28),
  defineItem("pk-fl-24", "Drayton", "sv8", "Surging Sparks", "244", "https://images.pokemontcg.io/sv8/244_hires.png", "Mythic", "Ancient Rare", 3500, 1.6, 35),
  defineItem("pk-fl-25", "Pikachu ex", "sv8", "Surging Sparks", "247", "https://images.pokemontcg.io/sv8/247_hires.png", "Mythic", "Ancient Rare", 7140, 1.2, 71.4),
];

/** Weekend Warrior — exclusive competitive battle ex and meta chase cards. */
export const WEEKEND_WARRIOR_POOL: StoreItem[] = [
  defineItem("pk-ww-01", "Hisuian Growlithe", "sv6", "Twilight Masquerade", "99", "https://images.pokemontcg.io/sv6/99_hires.png", "Common", "Common", 10, 5.2, 0.1),
  defineItem("pk-ww-02", "Hisuian Arcanine", "sv6", "Twilight Masquerade", "100", "https://images.pokemontcg.io/sv6/100_hires.png", "Common", "Common", 12, 5, 0.12),
  defineItem("pk-ww-03", "Riolu", "swsh9", "Brilliant Stars", "78", "https://images.pokemontcg.io/swsh9/78_hires.png", "Common", "Common", 15, 5, 0.15),
  defineItem("pk-ww-04", "Machop", "sv3pt5", "151", "66", "https://images.pokemontcg.io/sv3pt5/66_hires.png", "Common", "Common", 10, 5.2, 0.1),
  defineItem("pk-ww-05", "Nacli", "sv4", "Paradox Rift", "102", "https://images.pokemontcg.io/sv4/102_hires.png", "Common", "Common", 8, 5.2, 0.08),
  defineItem("pk-ww-06", "Sudowoodo", "sv2", "Paldea Evolved", "109", "https://images.pokemontcg.io/sv2/109_hires.png", "Rare", "Rare", 250, 3.6, 2.5),
  defineItem("pk-ww-07", "Garganacl", "sv4", "Paradox Rift", "104", "https://images.pokemontcg.io/sv4/104_hires.png", "Rare", "Rare", 180, 3.8, 1.8),
  defineItem("pk-ww-08", "Porygon-Z", "sv4", "Paradox Rift", "144", "https://images.pokemontcg.io/sv4/144_hires.png", "Rare", "Rare", 120, 4, 1.2),
  defineItem("pk-ww-09", "Xerneas", "sv8", "Surging Sparks", "88", "https://images.pokemontcg.io/sv8/88_hires.png", "Rare", "Rare", 85, 4, 0.85),
  defineItem("pk-ww-10", "Bidoof", "swsh9", "Brilliant Stars", "120", "https://images.pokemontcg.io/swsh9/120_hires.png", "Rare", "Rare", 320, 3.6, 3.2),
  defineItem("pk-ww-11", "Lana's Aid", "sv6", "Twilight Masquerade", "155", "https://images.pokemontcg.io/sv6/155_hires.png", "Epic", "Rare", 1200, 3, 12),
  defineItem("pk-ww-12", "Iron Hands ex", "sv4", "Paradox Rift", "248", "https://images.pokemontcg.io/sv4/248_hires.png", "Epic", "Rare", 1800, 2.8, 18),
  defineItem("pk-ww-13", "Iron Boulder ex", "sv5", "Temporal Forces", "192", "https://images.pokemontcg.io/sv5/192_hires.png", "Epic", "Rare", 1500, 2.8, 15),
  defineItem("pk-ww-14", "Gouging Fire ex", "sv5", "Temporal Forces", "214", "https://images.pokemontcg.io/sv5/214_hires.png", "Epic", "Rare", 1400, 2.8, 14),
  defineItem("pk-ww-15", "Black Kyurem ex", "sv8", "Surging Sparks", "218", "https://images.pokemontcg.io/sv8/218_hires.png", "Epic", "Rare", 1600, 2.6, 16),
  defineItem("pk-ww-16", "Chien-Pao ex", "sv2", "Paldea Evolved", "261", "https://images.pokemontcg.io/sv2/261_hires.png", "Legendary", "Rare", 2800, 2.2, 28),
  defineItem("pk-ww-17", "Chi-Yu ex", "sv2", "Paldea Evolved", "259", "https://images.pokemontcg.io/sv2/259_hires.png", "Legendary", "Rare", 2200, 2.4, 22),
  defineItem("pk-ww-18", "Walking Wake ex", "sv5", "Temporal Forces", "205", "https://images.pokemontcg.io/sv5/205_hires.png", "Legendary", "Rare", 1800, 2.4, 18),
  defineItem("pk-ww-19", "Bloodmoon Ursaluna ex", "sv6", "Twilight Masquerade", "216", "https://images.pokemontcg.io/sv6/216_hires.png", "Legendary", "Rare", 2000, 2.4, 20),
  defineItem("pk-ww-20", "Sandy Shocks ex", "sv4", "Paradox Rift", "250", "https://images.pokemontcg.io/sv4/250_hires.png", "Legendary", "Rare", 2400, 2.2, 24),
  defineItem("pk-ww-21", "Deerling", "sv5", "Temporal Forces", "165", "https://images.pokemontcg.io/sv5/165_hires.png", "Mythic", "Ancient Rare", 3500, 1.6, 35),
  defineItem("pk-ww-22", "Gouging Fire ex", "sv5", "Temporal Forces", "204", "https://images.pokemontcg.io/sv5/204_hires.png", "Mythic", "Ancient Rare", 4200, 1.4, 42),
  defineItem("pk-ww-23", "Iron Leaves ex", "sv5", "Temporal Forces", "203", "https://images.pokemontcg.io/sv5/203_hires.png", "Mythic", "Ancient Rare", 2500, 1.8, 25),
  defineItem("pk-ww-24", "Spidops ex", "sv1", "Scarlet & Violet", "243", "https://images.pokemontcg.io/sv1/243_hires.png", "Mythic", "Ancient Rare", 5500, 1.4, 55),
  defineItem("pk-ww-25", "Miraidon ex", "sv1", "Scarlet & Violet", "244", "https://images.pokemontcg.io/sv1/244_hires.png", "Mythic", "Ancient Rare", 5200, 1.4, 52),
  defineItem("pk-ww-26", "Charizard ex SAR", "sv3", "Obsidian Flames", "228", "https://images.pokemontcg.io/sv3/228_hires.png", "Mythic", "Ancient Rare", 28000, 0.4, 280),
  defineItem("pk-ww-27", "Terapagos ex ex SAR", "sv8pt5", "Prismatic Evolutions", "169", "https://images.pokemontcg.io/sv8pt5/169_hires.png", "Mythic", "Ancient Rare", 158000, 0.5, 1580),
  defineItem("pk-ww-28", "Lugia V Alt Art", "swsh12", "Silver Tempest", "186", "https://images.pokemontcg.io/swsh12/186_hires.png", "Mythic", "Ancient Rare", 38000, 0.6, 380),
];

export const TRAINERS_STARTER_ITEM_IDS = TRAINERS_STARTER_POOL.map((i) => i.id);
export const PACK_151_ITEM_IDS = PACK_151_POOL.map((i) => i.id);
export const LEGENDARY_HUNT_ITEM_IDS = LEGENDARY_HUNT_POOL.map((i) => i.id);
export const GOD_PACK_1999_ITEM_IDS = GOD_PACK_1999_POOL.map((i) => i.id);
export const MEGA_EVOLUTION_ITEM_IDS = MEGA_EVOLUTION_POOL.map((i) => i.id);
export const PRISMATIC_SIR_ITEM_IDS = PRISMATIC_SIR_POOL.map((i) => i.id);
export const EVOLVING_SKIES_ITEM_IDS = EVOLVING_SKIES_POOL.map((i) => i.id);
export const WOTC_FIRST_EDITION_ITEM_IDS = WOTC_FIRST_EDITION_POOL.map((i) => i.id);
export const OBSIDIAN_VAULT_ITEM_IDS = OBSIDIAN_VAULT_POOL.map((i) => i.id);
export const PSA_10_CHASER_ITEM_IDS = PSA_10_CHASER_POOL.map((i) => i.id);
export const WAIFU_VAULT_ITEM_IDS = WAIFU_VAULT_POOL.map((i) => i.id);
export const SHINY_VAULT_ITEM_IDS = SHINY_VAULT_POOL.map((i) => i.id);
export const POWER_HOUR_ITEM_IDS = POWER_HOUR_POOL.map((i) => i.id);
export const MIDNIGHT_GRAIL_ITEM_IDS = MIDNIGHT_GRAIL_POOL.map((i) => i.id);
export const FLASH_ITEM_IDS = FLASH_POOL.map((i) => i.id);
export const WEEKEND_WARRIOR_ITEM_IDS = WEEKEND_WARRIOR_POOL.map((i) => i.id);

export const ALL_PACK_POKEMON_ITEMS: StoreItem[] = [
  ...TRAINERS_STARTER_POOL,
  ...PACK_151_POOL,
  ...LEGENDARY_HUNT_POOL,
  ...GOD_PACK_1999_POOL,
  ...MEGA_EVOLUTION_POOL,
  ...PRISMATIC_SIR_POOL,
  ...EVOLVING_SKIES_POOL,
  ...WOTC_FIRST_EDITION_POOL,
  ...OBSIDIAN_VAULT_POOL,
  ...PSA_10_CHASER_POOL,
  ...WAIFU_VAULT_POOL,
  ...SHINY_VAULT_POOL,
  ...POWER_HOUR_POOL,
  ...MIDNIGHT_GRAIL_POOL,
  ...FLASH_POOL,
  ...WEEKEND_WARRIOR_POOL,
];

export function storeItemToCard(item: StoreItem) {
  return {
    id: item.id,
    name: item.name,
    rarity: item.appRarity,
    value: item.value,
    image: item.image,
  };
}

export const POKEMON_CARD_POOL = ALL_PACK_POKEMON_ITEMS.map(storeItemToCard);
export const POKEMON_ALL_ITEM_IDS: string[] = ALL_PACK_POKEMON_ITEMS.map((item) => item.id);
export const POKEMON_MYTHIC_LEGENDARY_IDS: string[] = ALL_PACK_POKEMON_ITEMS.filter(
  (item) => item.rarity === "Mythic" || item.rarity === "Legendary",
).map((item) => item.id);
