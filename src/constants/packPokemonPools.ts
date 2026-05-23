import type { StoreItem, StoreRarity } from "../types/store";
import type { Rarity } from "../types";

function tcgImage(setId: string, number: string): string {
  return `https://images.pokemontcg.io/${setId}/${number}_hires.png`;
}

function defineItem(
  id: string,
  name: string,
  setId: string,
  setName: string,
  number: string,
  rarity: StoreRarity,
  appRarity: Rarity,
  value: number,
  probability: number,
  tcgMarketUsd: number,
): StoreItem {
  return {
    id,
    name,
    rarity,
    appRarity,
    value,
    image: tcgImage(setId, number),
    probability,
    tcgMarketUsd,
    setId,
    setName,
    number,
  };
}

/** Trainer's Starter — 25 modern Paradox Rift floor cards (commons, uncommons, holo rares). */
export const TRAINERS_STARTER_POOL: StoreItem[] = [
  defineItem("pk-starter-01", "Toedscool", "sv4", "Paradox Rift", "14", "Common", "Common", 35, 5.2, 0.12),
  defineItem("pk-starter-02", "Toedscruel", "sv4", "Paradox Rift", "15", "Common", "Common", 40, 5.0, 0.15),
  defineItem("pk-starter-03", "Pidgey", "sv4", "Paradox Rift", "16", "Common", "Common", 35, 5.0, 0.11),
  defineItem("pk-starter-04", "Pidgeotto", "sv4", "Paradox Rift", "17", "Common", "Common", 40, 4.8, 0.14),
  defineItem("pk-starter-05", "Magikarp", "sv4", "Paradox Rift", "42", "Common", "Common", 35, 5.0, 0.1),
  defineItem("pk-starter-06", "Gyarados", "sv4", "Paradox Rift", "43", "Common", "Common", 45, 4.6, 0.18),
  defineItem("pk-starter-07", "Spinda", "sv4", "Paradox Rift", "151", "Common", "Common", 30, 5.2, 0.09),
  defineItem("pk-starter-08", "Swablu", "sv4", "Paradox Rift", "152", "Common", "Common", 30, 5.2, 0.1),
  defineItem("pk-starter-09", "Tandemaus", "sv4", "Paradox Rift", "153", "Common", "Common", 30, 5.0, 0.11),
  defineItem("pk-starter-10", "Cyclizar", "sv4", "Paradox Rift", "157", "Common", "Common", 35, 4.8, 0.13),
  defineItem("pk-starter-11", "Gimmighoul", "sv4", "Paradox Rift", "87", "Common", "Common", 40, 4.6, 0.16),
  defineItem("pk-starter-12", "Greavard", "sv4", "Paradox Rift", "90", "Common", "Common", 35, 4.8, 0.12),
  defineItem("pk-starter-13", "Flittle", "sv4", "Paradox Rift", "94", "Common", "Common", 30, 5.0, 0.1),
  defineItem("pk-starter-14", "Varoom", "sv4", "Paradox Rift", "140", "Common", "Common", 35, 4.8, 0.14),
  defineItem("pk-starter-15", "Orthworm", "sv4", "Paradox Rift", "141", "Common", "Common", 40, 4.6, 0.15),
  defineItem("pk-starter-16", "Gimmighoul", "sv4", "Paradox Rift", "88", "Rare", "Rare", 95, 3.4, 0.45),
  defineItem("pk-starter-17", "Espathra", "sv4", "Paradox Rift", "96", "Rare", "Rare", 110, 3.2, 0.55),
  defineItem("pk-starter-18", "Scovillain", "sv4", "Paradox Rift", "28", "Rare", "Rare", 100, 3.2, 0.5),
  defineItem("pk-starter-19", "Tinkatuff", "sv4", "Paradox Rift", "105", "Rare", "Rare", 105, 3.0, 0.48),
  defineItem("pk-starter-20", "Bombirdier", "sv4", "Paradox Rift", "145", "Rare", "Rare", 115, 2.8, 0.62),
  defineItem("pk-starter-21", "Crocalor", "sv4", "Paradox Rift", "24", "Epic", "Rare", 220, 2.2, 1.2),
  defineItem("pk-starter-22", "Quaxwell", "sv4", "Paradox Rift", "52", "Epic", "Rare", 210, 2.2, 1.1),
  defineItem("pk-starter-23", "Flamigo", "sv4", "Paradox Rift", "97", "Epic", "Rare", 240, 2.0, 1.35),
  defineItem("pk-starter-24", "Tinkaton", "sv4", "Paradox Rift", "106", "Epic", "Rare", 280, 1.8, 1.8),
  defineItem("pk-starter-25", "Gholdengo", "sv4", "Paradox Rift", "99", "Epic", "Rare", 350, 1.6, 2.4),
];

/** 151 Booster Collector — 25 Scarlet & Violet 151 (sv3pt5) chase cards. */
export const PACK_151_POOL: StoreItem[] = [
  defineItem("pk-151-01", "Bulbasaur", "sv3pt5", "151", "1", "Common", "Common", 120, 4.5, 0.35),
  defineItem("pk-151-02", "Charmander", "sv3pt5", "151", "4", "Common", "Common", 120, 4.5, 0.38),
  defineItem("pk-151-03", "Squirtle", "sv3pt5", "151", "7", "Common", "Common", 120, 4.5, 0.36),
  defineItem("pk-151-04", "Pikachu", "sv3pt5", "151", "25", "Rare", "Rare", 280, 4.0, 1.1),
  defineItem("pk-151-05", "Eevee", "sv3pt5", "151", "133", "Rare", "Rare", 320, 3.8, 1.4),
  defineItem("pk-151-06", "Snorlax", "sv3pt5", "151", "143", "Rare", "Rare", 350, 3.6, 1.6),
  defineItem("pk-151-07", "Bulbasaur", "sv3pt5", "151", "166", "Epic", "Rare", 650, 3.2, 4.5),
  defineItem("pk-151-08", "Charmander", "sv3pt5", "151", "168", "Epic", "Rare", 720, 3.0, 5.2),
  defineItem("pk-151-09", "Squirtle", "sv3pt5", "151", "170", "Epic", "Rare", 680, 3.0, 4.8),
  defineItem("pk-151-10", "Pikachu", "sv3pt5", "151", "173", "Epic", "Rare", 900, 2.8, 7.5),
  defineItem("pk-151-11", "Psyduck", "sv3pt5", "151", "174", "Epic", "Rare", 550, 3.2, 3.9),
  defineItem("pk-151-12", "Geodude", "sv3pt5", "151", "178", "Epic", "Rare", 480, 3.4, 3.2),
  defineItem("pk-151-13", "Venusaur ex", "sv3pt5", "151", "183", "Legendary", "Rare", 1800, 2.4, 18),
  defineItem("pk-151-14", "Charizard ex", "sv3pt5", "151", "184", "Legendary", "Rare", 2200, 2.2, 24),
  defineItem("pk-151-15", "Blastoise ex", "sv3pt5", "151", "185", "Legendary", "Rare", 1900, 2.4, 20),
  defineItem("pk-151-16", "Mewtwo ex", "sv3pt5", "151", "190", "Legendary", "Rare", 2400, 2.0, 28),
  defineItem("pk-151-17", "Alakazam ex", "sv3pt5", "151", "199", "Legendary", "Rare", 1600, 2.6, 16),
  defineItem("pk-151-18", "Zapdos ex", "sv3pt5", "151", "200", "Legendary", "Rare", 1500, 2.6, 15),
  defineItem("pk-151-19", "Mew ex", "sv3pt5", "151", "193", "Mythic", "Ancient Rare", 4500, 1.8, 55),
  defineItem("pk-151-20", "Charizard ex", "sv3pt5", "151", "199", "Mythic", "Ancient Rare", 5200, 1.6, 68),
  defineItem("pk-151-21", "Blastoise ex", "sv3pt5", "151", "200", "Mythic", "Ancient Rare", 4800, 1.6, 62),
  defineItem("pk-151-22", "Venusaur ex", "sv3pt5", "151", "198", "Mythic", "Ancient Rare", 4200, 1.8, 52),
  defineItem("pk-151-23", "Mew ex", "sv3pt5", "151", "205", "Mythic", "Ancient Rare", 12000, 1.0, 145),
  defineItem("pk-151-24", "Charizard ex", "sv3pt5", "151", "201", "Mythic", "Ancient Rare", 8500, 1.2, 95),
  defineItem("pk-151-25", "Mew ex", "sv3pt5", "151", "194", "Mythic", "Ancient Rare", 6000, 1.4, 72),
];

/** Legendary Hunt — 25 SWSH & SV alternate arts / illustration rares. */
export const LEGENDARY_HUNT_POOL: StoreItem[] = [
  defineItem("pk-hunt-01", "Giratina V", "swsh11", "Lost Origin", "186", "Mythic", "Ancient Rare", 18000, 2.0, 85),
  defineItem("pk-hunt-02", "Lugia V", "swsh12", "Silver Tempest", "186", "Mythic", "Ancient Rare", 16000, 2.2, 78),
  defineItem("pk-hunt-03", "Origin Forme Dialga VSTAR", "swsh10", "Astral Radiance", "186", "Mythic", "Ancient Rare", 14000, 2.4, 65),
  defineItem("pk-hunt-04", "Origin Forme Palkia VSTAR", "swsh10", "Astral Radiance", "187", "Mythic", "Ancient Rare", 13500, 2.4, 62),
  defineItem("pk-hunt-05", "Umbreon VMAX", "swsh7", "Evolving Skies", "215", "Mythic", "Ancient Rare", 22000, 1.6, 120),
  defineItem("pk-hunt-06", "Rayquaza VMAX", "swsh8", "Fusion Strike", "217", "Mythic", "Ancient Rare", 15000, 2.2, 70),
  defineItem("pk-hunt-07", "Arceus VSTAR", "swsh9", "Brilliant Stars", "184", "Legendary", "Rare", 5500, 3.2, 32),
  defineItem("pk-hunt-08", "Charizard VSTAR", "swsh9", "Brilliant Stars", "174", "Legendary", "Rare", 4800, 3.4, 28),
  defineItem("pk-hunt-09", "Gardevoir ex", "sv1", "Scarlet & Violet", "245", "Mythic", "Ancient Rare", 12000, 2.0, 58),
  defineItem("pk-hunt-10", "Miraidon ex", "sv1", "Scarlet & Violet", "244", "Mythic", "Ancient Rare", 11000, 2.2, 52),
  defineItem("pk-hunt-11", "Iono", "sv2", "Paldea Evolved", "244", "Mythic", "Ancient Rare", 14000, 2.0, 68),
  defineItem("pk-hunt-12", "Skeledirge ex", "sv2", "Paldea Evolved", "245", "Legendary", "Rare", 4200, 3.6, 24),
  defineItem("pk-hunt-13", "Charizard ex", "sv3", "Obsidian Flames", "223", "Mythic", "Ancient Rare", 16000, 1.8, 82),
  defineItem("pk-hunt-14", "Charizard ex", "sv3", "Obsidian Flames", "228", "Mythic", "Ancient Rare", 18500, 1.6, 95),
  defineItem("pk-hunt-15", "Gyarados ex", "sv3", "Obsidian Flames", "225", "Legendary", "Rare", 3800, 3.8, 22),
  defineItem("pk-hunt-16", "Garchomp ex", "sv4", "Paradox Rift", "245", "Mythic", "Ancient Rare", 12500, 2.0, 55),
  defineItem("pk-hunt-17", "Iron Valiant ex", "sv4", "Paradox Rift", "249", "Mythic", "Ancient Rare", 11500, 2.2, 48),
  defineItem("pk-hunt-18", "Roaring Moon ex", "sv4", "Paradox Rift", "251", "Mythic", "Ancient Rare", 13000, 2.0, 60),
  defineItem("pk-hunt-19", "Gholdengo ex", "sv4", "Paradox Rift", "252", "Legendary", "Rare", 3600, 4.0, 20),
  defineItem("pk-hunt-20", "Mew ex", "sv3pt5", "151", "205", "Mythic", "Ancient Rare", 20000, 1.4, 110),
  defineItem("pk-hunt-21", "Charizard ex", "sv3pt5", "151", "201", "Mythic", "Ancient Rare", 17000, 1.6, 88),
  defineItem("pk-hunt-22", "Blaziken VMAX", "swsh6", "Chilling Reign", "201", "Legendary", "Rare", 3200, 4.2, 18),
  defineItem("pk-hunt-23", "Leafeon VMAX", "swsh7", "Evolving Skies", "205", "Legendary", "Rare", 4500, 3.6, 26),
  defineItem("pk-hunt-24", "Sylveon VMAX", "swsh7", "Evolving Skies", "212", "Legendary", "Rare", 5200, 3.2, 30),
  defineItem("pk-hunt-25", "Giratina VSTAR", "swsh11", "Lost Origin", "131", "Epic", "Rare", 2800, 4.4, 16),
];

/** The 1999 God Pack — 23 vintage base-set grails; floor 500–1,000 Gems. */
export const GOD_PACK_1999_POOL: StoreItem[] = [
  defineItem("pk-god-01", "Machoke", "base1", "Base", "42", "Rare", "Rare", 550, 6.0, 8),
  defineItem("pk-god-02", "Magneton", "base1", "Base", "11", "Rare", "Rare", 650, 5.5, 12),
  defineItem("pk-god-03", "Electabuzz", "base1", "Base", "20", "Rare", "Rare", 600, 5.8, 10),
  defineItem("pk-god-04", "Ninetales", "base1", "Base", "12", "Rare", "Rare", 750, 5.2, 14),
  defineItem("pk-god-05", "Poliwrath", "base1", "Base", "13", "Rare", "Rare", 700, 5.4, 13),
  defineItem("pk-god-06", "Raichu", "base1", "Base", "14", "Rare", "Rare", 800, 5.0, 16),
  defineItem("pk-god-07", "Clefairy Holo", "base1", "Base", "5", "Epic", "Rare", 1000, 4.6, 22),
  defineItem("pk-god-08", "Nidoking Holo", "base1", "Base", "11", "Epic", "Rare", 950, 4.8, 20),
  defineItem("pk-god-09", "Gyarados Holo", "base1", "Base", "6", "Legendary", "Rare", 3500, 3.8, 55),
  defineItem("pk-god-10", "Alakazam Holo", "base1", "Base", "1", "Legendary", "Rare", 4200, 3.4, 68),
  defineItem("pk-god-11", "Machamp Holo", "base1", "Base", "8", "Legendary", "Rare", 2800, 4.0, 42),
  defineItem("pk-god-12", "Zapdos Holo", "base1", "Base", "16", "Legendary", "Rare", 4800, 3.2, 75),
  defineItem("pk-god-13", "Mewtwo Holo", "base1", "Base", "10", "Mythic", "Ancient Rare", 12000, 2.4, 180),
  defineItem("pk-god-14", "Venusaur Holo", "base1", "Base", "15", "Mythic", "Ancient Rare", 18000, 2.0, 260),
  defineItem("pk-god-15", "Blastoise Holo", "base1", "Base", "2", "Mythic", "Ancient Rare", 22000, 1.8, 320),
  defineItem("pk-god-16", "Charizard Holo", "base1", "Base", "4", "Mythic", "Ancient Rare", 50000, 1.2, 750),
  defineItem("pk-god-17", "Charizard Holo — PSA 8", "base1", "Base", "4", "Mythic", "Ancient Rare", 35000, 1.6, 520),
  defineItem("pk-god-18", "Blastoise Holo — PSA 9", "base1", "Base", "2", "Mythic", "Ancient Rare", 28000, 1.8, 410),
  defineItem("pk-god-19", "Venusaur Holo — PSA 9", "base1", "Base", "15", "Mythic", "Ancient Rare", 24000, 2.0, 350),
  defineItem("pk-god-20", "Mewtwo Holo — PSA 9", "base1", "Base", "10", "Mythic", "Ancient Rare", 20000, 2.2, 290),
  defineItem("pk-god-21", "Chansey Holo", "base1", "Base", "3", "Legendary", "Rare", 6500, 3.0, 95),
  defineItem("pk-god-22", "Hitmonlee Holo", "base1", "Base", "7", "Legendary", "Rare", 5200, 3.2, 78),
  defineItem("pk-god-23", "Charizard Holo — BGS 9.5", "base1", "Base", "4", "Mythic", "Ancient Rare", 75000, 0.8, 1200),
];

/** Mega Evolution EX — 25 XY-era Mega Evolution chase cards. */
export const MEGA_EVOLUTION_POOL: StoreItem[] = [
  defineItem("pk-mega-01", "Honedge", "xy3", "Furious Fists", "59", "Common", "Common", 180, 5.0, 0.45),
  defineItem("pk-mega-02", "Doublade", "xy3", "Furious Fists", "60", "Common", "Common", 200, 4.8, 0.5),
  defineItem("pk-mega-03", "Gulpin", "xy4", "Phantom Forces", "34", "Common", "Common", 190, 4.8, 0.48),
  defineItem("pk-mega-04", "Swirlix", "xy4", "Phantom Forces", "72", "Common", "Common", 210, 4.6, 0.52),
  defineItem("pk-mega-05", "Electrike", "xy6", "Roaring Skies", "30", "Common", "Common", 220, 4.6, 0.55),
  defineItem("pk-mega-06", "Manectric", "xy6", "Roaring Skies", "31", "Rare", "Rare", 420, 4.0, 1.1),
  defineItem("pk-mega-07", "Hawlucha", "xy6", "Roaring Skies", "42", "Rare", "Rare", 480, 3.8, 1.25),
  defineItem("pk-mega-08", "Gallade EX", "xy3", "Furious Fists", "64", "Rare", "Rare", 550, 3.6, 1.4),
  defineItem("pk-mega-09", "Lucario EX", "xy3", "Furious Fists", "55", "Epic", "Rare", 950, 3.2, 2.4),
  defineItem("pk-mega-10", "Gengar EX", "xy4", "Phantom Forces", "34", "Epic", "Rare", 1100, 3.0, 2.8),
  defineItem("pk-mega-11", "Rayquaza EX", "xy6", "Roaring Skies", "76", "Epic", "Rare", 1400, 2.8, 3.5),
  defineItem("pk-mega-12", "Gardevoir EX", "xy5", "Primal Clash", "78", "Epic", "Rare", 1250, 2.8, 3.2),
  defineItem("pk-mega-13", "Ampharos EX", "xy7", "Ancient Origins", "74", "Legendary", "Rare", 2800, 2.4, 8),
  defineItem("pk-mega-14", "Alakazam EX", "xy10", "Fates Collide", "27", "Legendary", "Rare", 3200, 2.2, 9.5),
  defineItem("pk-mega-15", "Steelix EX", "xy11", "Steam Siege", "36", "Legendary", "Rare", 2600, 2.4, 7.5),
  defineItem("pk-mega-16", "Mega Lucario EX", "xy3", "Furious Fists", "55", "Legendary", "Rare", 4500, 2.0, 14),
  defineItem("pk-mega-17", "Mega Gengar EX", "xy4", "Phantom Forces", "35", "Mythic", "Ancient Rare", 7200, 1.6, 22),
  defineItem("pk-mega-18", "Mega Rayquaza EX", "xy6", "Roaring Skies", "76", "Mythic", "Ancient Rare", 8500, 1.4, 28),
  defineItem("pk-mega-19", "Mega Alakazam EX", "xy10", "Fates Collide", "27", "Mythic", "Ancient Rare", 6800, 1.6, 20),
  defineItem("pk-mega-20", "Mega Gardevoir EX", "xy5", "Primal Clash", "78", "Mythic", "Ancient Rare", 6200, 1.8, 18),
  defineItem("pk-mega-21", "Mega Ampharos EX", "xy7", "Ancient Origins", "74", "Mythic", "Ancient Rare", 5800, 1.8, 16),
  defineItem("pk-mega-22", "Mega Charizard EX", "xy12", "Evolutions", "12", "Mythic", "Ancient Rare", 12000, 1.2, 38),
  defineItem("pk-mega-23", "Mega Blastoise EX", "xy12", "Evolutions", "27", "Mythic", "Ancient Rare", 9500, 1.4, 32),
  defineItem("pk-mega-24", "Mega Venusaur EX", "xy12", "Evolutions", "89", "Mythic", "Ancient Rare", 8800, 1.4, 30),
  defineItem("pk-mega-25", "Primal Groudon EX", "xy5", "Primal Clash", "77", "Mythic", "Ancient Rare", 14000, 1.0, 45),
];

/** Prismatic Evolutions — 25 Eeveelution SIR / premium illustration rares. */
export const PRISMATIC_SIR_POOL: StoreItem[] = [
  defineItem("pk-sir-01", "Eevee", "sv8pt5", "Prismatic Evolutions", "1", "Common", "Common", 450, 4.8, 1.2),
  defineItem("pk-sir-02", "Vaporeon", "sv8pt5", "Prismatic Evolutions", "22", "Common", "Common", 480, 4.6, 1.3),
  defineItem("pk-sir-03", "Jolteon", "sv8pt5", "Prismatic Evolutions", "29", "Common", "Common", 480, 4.6, 1.3),
  defineItem("pk-sir-04", "Flareon", "sv8pt5", "Prismatic Evolutions", "13", "Common", "Common", 470, 4.6, 1.25),
  defineItem("pk-sir-05", "Espeon", "sv8pt5", "Prismatic Evolutions", "33", "Rare", "Rare", 850, 4.0, 2.2),
  defineItem("pk-sir-06", "Umbreon", "sv8pt5", "Prismatic Evolutions", "59", "Rare", "Rare", 920, 3.8, 2.5),
  defineItem("pk-sir-07", "Leafeon", "sv8pt5", "Prismatic Evolutions", "40", "Rare", "Rare", 880, 3.8, 2.4),
  defineItem("pk-sir-08", "Glaceon", "sv8pt5", "Prismatic Evolutions", "25", "Rare", "Rare", 860, 3.8, 2.3),
  defineItem("pk-sir-09", "Sylveon", "sv8pt5", "Prismatic Evolutions", "45", "Rare", "Rare", 900, 3.8, 2.45),
  defineItem("pk-sir-10", "Eevee ex", "sv8pt5", "Prismatic Evolutions", "74", "Epic", "Rare", 2200, 3.2, 6.5),
  defineItem("pk-sir-11", "Vaporeon ex", "sv8pt5", "Prismatic Evolutions", "89", "Epic", "Rare", 2400, 3.0, 7.2),
  defineItem("pk-sir-12", "Jolteon ex", "sv8pt5", "Prismatic Evolutions", "94", "Epic", "Rare", 2350, 3.0, 7),
  defineItem("pk-sir-13", "Flareon ex", "sv8pt5", "Prismatic Evolutions", "84", "Epic", "Rare", 2300, 3.0, 6.8),
  defineItem("pk-sir-14", "Espeon ex", "sv8pt5", "Prismatic Evolutions", "99", "Legendary", "Rare", 5200, 2.4, 16),
  defineItem("pk-sir-15", "Umbreon ex", "sv8pt5", "Prismatic Evolutions", "104", "Legendary", "Rare", 5800, 2.2, 18),
  defineItem("pk-sir-16", "Leafeon ex", "sv8pt5", "Prismatic Evolutions", "109", "Legendary", "Rare", 5100, 2.4, 15),
  defineItem("pk-sir-17", "Glaceon ex", "sv8pt5", "Prismatic Evolutions", "114", "Legendary", "Rare", 5000, 2.4, 14.5),
  defineItem("pk-sir-18", "Sylveon ex", "sv8pt5", "Prismatic Evolutions", "119", "Legendary", "Rare", 5400, 2.2, 16.5),
  defineItem("pk-sir-19", "Eevee SIR", "sv8pt5", "Prismatic Evolutions", "144", "Mythic", "Ancient Rare", 12000, 1.6, 38),
  defineItem("pk-sir-20", "Vaporeon SIR", "sv8pt5", "Prismatic Evolutions", "149", "Mythic", "Ancient Rare", 13500, 1.4, 42),
  defineItem("pk-sir-21", "Jolteon SIR", "sv8pt5", "Prismatic Evolutions", "154", "Mythic", "Ancient Rare", 13000, 1.4, 40),
  defineItem("pk-sir-22", "Flareon SIR", "sv8pt5", "Prismatic Evolutions", "159", "Mythic", "Ancient Rare", 12800, 1.4, 39),
  defineItem("pk-sir-23", "Espeon SIR", "sv8pt5", "Prismatic Evolutions", "164", "Mythic", "Ancient Rare", 16000, 1.2, 52),
  defineItem("pk-sir-24", "Umbreon SIR", "sv8pt5", "Prismatic Evolutions", "169", "Mythic", "Ancient Rare", 22000, 1.0, 72),
  defineItem("pk-sir-25", "Sylveon SIR", "sv8pt5", "Prismatic Evolutions", "174", "Mythic", "Ancient Rare", 18000, 1.2, 58),
];

/** Evolving Skies Chase — 25 alternate-art grail chase cards from swsh7. */
export const EVOLVING_SKIES_POOL: StoreItem[] = [
  defineItem("pk-es-01", "Eevee", "swsh7", "Evolving Skies", "125", "Common", "Common", 650, 4.6, 1.6),
  defineItem("pk-es-02", "Teddiursa", "swsh7", "Evolving Skies", "126", "Common", "Common", 620, 4.6, 1.5),
  defineItem("pk-es-03", "Lilligant", "swsh7", "Evolving Skies", "10", "Common", "Common", 600, 4.8, 1.45),
  defineItem("pk-es-04", "Dwebble", "swsh7", "Evolving Skies", "11", "Common", "Common", 580, 4.8, 1.4),
  defineItem("pk-es-05", "Gossifleur", "swsh7", "Evolving Skies", "15", "Common", "Common", 590, 4.8, 1.42),
  defineItem("pk-es-06", "Flareon V", "swsh7", "Evolving Skies", "18", "Rare", "Rare", 1400, 3.6, 3.5),
  defineItem("pk-es-07", "Vaporeon V", "swsh7", "Evolving Skies", "22", "Rare", "Rare", 1450, 3.6, 3.6),
  defineItem("pk-es-08", "Jolteon V", "swsh7", "Evolving Skies", "28", "Rare", "Rare", 1420, 3.6, 3.55),
  defineItem("pk-es-09", "Espeon V", "swsh7", "Evolving Skies", "35", "Epic", "Rare", 2800, 3.0, 7.5),
  defineItem("pk-es-10", "Umbreon V", "swsh7", "Evolving Skies", "94", "Epic", "Rare", 3200, 2.8, 8.5),
  defineItem("pk-es-11", "Leafeon V", "swsh7", "Evolving Skies", "7", "Epic", "Rare", 2600, 3.0, 7),
  defineItem("pk-es-12", "Glaceon V", "swsh7", "Evolving Skies", "40", "Epic", "Rare", 2550, 3.0, 6.8),
  defineItem("pk-es-13", "Sylveon V", "swsh7", "Evolving Skies", "74", "Epic", "Rare", 2700, 3.0, 7.2),
  defineItem("pk-es-14", "Dragonite V", "swsh7", "Evolving Skies", "192", "Legendary", "Rare", 6500, 2.2, 18),
  defineItem("pk-es-15", "Rayquaza V", "swsh7", "Evolving Skies", "110", "Legendary", "Rare", 7200, 2.0, 20),
  defineItem("pk-es-16", "Duraludon VMAX", "swsh7", "Evolving Skies", "123", "Legendary", "Rare", 5800, 2.2, 16),
  defineItem("pk-es-17", "Leafeon VMAX", "swsh7", "Evolving Skies", "205", "Mythic", "Ancient Rare", 14000, 1.4, 42),
  defineItem("pk-es-18", "Glaceon VMAX", "swsh7", "Evolving Skies", "209", "Mythic", "Ancient Rare", 13500, 1.4, 40),
  defineItem("pk-es-19", "Sylveon VMAX", "swsh7", "Evolving Skies", "212", "Mythic", "Ancient Rare", 15000, 1.2, 45),
  defineItem("pk-es-20", "Rayquaza VMAX", "swsh7", "Evolving Skies", "217", "Mythic", "Ancient Rare", 18000, 1.0, 55),
  defineItem("pk-es-21", "Umbreon VMAX", "swsh7", "Evolving Skies", "215", "Mythic", "Ancient Rare", 28000, 0.8, 85),
  defineItem("pk-es-22", "Dragonite V Alt Art", "swsh7", "Evolving Skies", "192", "Mythic", "Ancient Rare", 16000, 1.2, 48),
  defineItem("pk-es-23", "Rayquaza V Alt Art", "swsh7", "Evolving Skies", "110", "Mythic", "Ancient Rare", 20000, 1.0, 62),
  defineItem("pk-es-24", "Umbreon V Alt Art", "swsh7", "Evolving Skies", "94", "Mythic", "Ancient Rare", 24000, 0.8, 75),
  defineItem("pk-es-25", "Rayquaza VMAX Alt Art", "swsh7", "Evolving Skies", "218", "Mythic", "Ancient Rare", 32000, 0.6, 98),
];

/** WOTC 1st Edition Classic — 25 vintage 1999–2000 first edition holos only. */
export const WOTC_FIRST_EDITION_POOL: StoreItem[] = [
  defineItem("pk-wotc-01", "Machop 1st Ed", "base1", "Base Set 1st Ed", "52", "Rare", "Rare", 3500, 5.0, 28),
  defineItem("pk-wotc-02", "Magikarp 1st Ed", "base1", "Base Set 1st Ed", "35", "Rare", "Rare", 3200, 5.2, 25),
  defineItem("pk-wotc-03", "Poliwhirl 1st Ed", "base1", "Base Set 1st Ed", "38", "Rare", "Rare", 3400, 5.0, 26),
  defineItem("pk-wotc-04", "Nidorino 1st Ed", "base1", "Base Set 1st Ed", "33", "Rare", "Rare", 3300, 5.0, 25.5),
  defineItem("pk-wotc-05", "Growlithe 1st Ed", "base1", "Base Set 1st Ed", "28", "Rare", "Rare", 3100, 5.2, 24),
  defineItem("pk-wotc-06", "Machoke 1st Ed", "base1", "Base Set 1st Ed", "42", "Epic", "Rare", 6500, 4.2, 48),
  defineItem("pk-wotc-07", "Magneton 1st Ed", "base1", "Base Set 1st Ed", "11", "Epic", "Rare", 7200, 4.0, 52),
  defineItem("pk-wotc-08", "Raichu 1st Ed", "base1", "Base Set 1st Ed", "14", "Epic", "Rare", 8500, 3.8, 62),
  defineItem("pk-wotc-09", "Ninetales 1st Ed Holo", "base1", "Base Set 1st Ed", "12", "Legendary", "Rare", 18000, 2.8, 130),
  defineItem("pk-wotc-10", "Poliwrath 1st Ed Holo", "base1", "Base Set 1st Ed", "13", "Legendary", "Rare", 17500, 2.8, 125),
  defineItem("pk-wotc-11", "Clefairy 1st Ed Holo", "base1", "Base Set 1st Ed", "5", "Legendary", "Rare", 22000, 2.4, 160),
  defineItem("pk-wotc-12", "Nidoking 1st Ed Holo", "base1", "Base Set 1st Ed", "11", "Legendary", "Rare", 24000, 2.2, 175),
  defineItem("pk-wotc-13", "Gyarados 1st Ed Holo", "base1", "Base Set 1st Ed", "6", "Mythic", "Ancient Rare", 42000, 1.6, 310),
  defineItem("pk-wotc-14", "Alakazam 1st Ed Holo", "base1", "Base Set 1st Ed", "1", "Mythic", "Ancient Rare", 48000, 1.4, 360),
  defineItem("pk-wotc-15", "Machamp 1st Ed Holo", "base1", "Base Set 1st Ed", "8", "Mythic", "Ancient Rare", 38000, 1.6, 285),
  defineItem("pk-wotc-16", "Zapdos 1st Ed Holo", "base1", "Base Set 1st Ed", "16", "Mythic", "Ancient Rare", 52000, 1.2, 390),
  defineItem("pk-wotc-17", "Mewtwo 1st Ed Holo", "base1", "Base Set 1st Ed", "10", "Mythic", "Ancient Rare", 65000, 1.0, 490),
  defineItem("pk-wotc-18", "Venusaur 1st Ed Holo", "base1", "Base Set 1st Ed", "15", "Mythic", "Ancient Rare", 85000, 0.8, 650),
  defineItem("pk-wotc-19", "Blastoise 1st Ed Holo", "base1", "Base Set 1st Ed", "2", "Mythic", "Ancient Rare", 95000, 0.7, 720),
  defineItem("pk-wotc-20", "Charizard 1st Ed Holo", "base1", "Base Set 1st Ed", "4", "Mythic", "Ancient Rare", 180000, 0.4, 1400),
  defineItem("pk-wotc-21", "Chansey 1st Ed Holo", "base1", "Base Set 1st Ed", "3", "Mythic", "Ancient Rare", 55000, 1.2, 420),
  defineItem("pk-wotc-22", "Hitmonlee 1st Ed Holo", "base1", "Base Set 1st Ed", "7", "Mythic", "Ancient Rare", 48000, 1.4, 360),
  defineItem("pk-wotc-23", "Jungle 1st Ed Snorlax Holo", "base2", "Jungle 1st Ed", "27", "Mythic", "Ancient Rare", 42000, 1.6, 310),
  defineItem("pk-wotc-24", "Fossil 1st Ed Gengar Holo", "base3", "Fossil 1st Ed", "5", "Mythic", "Ancient Rare", 58000, 1.2, 440),
  defineItem("pk-wotc-25", "Charizard 1st Ed Holo — PSA 9", "base1", "Base Set 1st Ed", "4", "Mythic", "Ancient Rare", 220000, 0.3, 1750),
];

export const TRAINERS_STARTER_ITEM_IDS = TRAINERS_STARTER_POOL.map((i) => i.id);
export const PACK_151_ITEM_IDS = PACK_151_POOL.map((i) => i.id);
export const LEGENDARY_HUNT_ITEM_IDS = LEGENDARY_HUNT_POOL.map((i) => i.id);
export const GOD_PACK_1999_ITEM_IDS = GOD_PACK_1999_POOL.map((i) => i.id);
export const MEGA_EVOLUTION_ITEM_IDS = MEGA_EVOLUTION_POOL.map((i) => i.id);
export const PRISMATIC_SIR_ITEM_IDS = PRISMATIC_SIR_POOL.map((i) => i.id);
export const EVOLVING_SKIES_ITEM_IDS = EVOLVING_SKIES_POOL.map((i) => i.id);
export const WOTC_FIRST_EDITION_ITEM_IDS = WOTC_FIRST_EDITION_POOL.map((i) => i.id);

export const ALL_PACK_POKEMON_ITEMS: StoreItem[] = [
  ...TRAINERS_STARTER_POOL,
  ...PACK_151_POOL,
  ...LEGENDARY_HUNT_POOL,
  ...GOD_PACK_1999_POOL,
  ...MEGA_EVOLUTION_POOL,
  ...PRISMATIC_SIR_POOL,
  ...EVOLVING_SKIES_POOL,
  ...WOTC_FIRST_EDITION_POOL,
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
