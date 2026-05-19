import type { Card } from "../types";

function pull(
  id: string,
  name: string,
  rarity: Card["rarity"],
  value: number,
  image: string,
): Card {
  return { id, name, rarity, value, image };
}

/** Per-collector trophy case — unique cards scaled to leaderboard rank. */
export const COLLECTOR_TOP_PULLS: Record<string, Card[]> = {
  VaultHunter: [
    pull(
      "vh-1",
      "Umbreon VMAX (Alt Art)",
      "Ancient Rare",
      92_000,
      "https://images.pokemontcg.io/swsh7/215_hires.png",
    ),
    pull(
      "vh-2",
      "Charizard ex (Obsidian Flames)",
      "Ancient Rare",
      68_000,
      "https://images.pokemontcg.io/svsh3/125_hires.png",
    ),
    pull(
      "vh-3",
      "Garchomp ex (Secret Rare)",
      "Ancient Rare",
      52_000,
      "https://images.pokemontcg.io/sv4/245_hires.png",
    ),
  ],
  CryptoKing: [
    pull(
      "ck-1",
      "Charizard (Base Set 1st Edition)",
      "Ancient Rare",
      75_000,
      "https://images.pokemontcg.io/base1/4_hires.png",
    ),
    pull(
      "ck-2",
      "Garchomp ex (Secret Rare)",
      "Ancient Rare",
      50_000,
      "https://images.pokemontcg.io/sv4/245_hires.png",
    ),
    pull(
      "ck-3",
      "Mew ex (Ultra Rare)",
      "Ancient Rare",
      25_000,
      "https://images.pokemontcg.io/me1/151_hires.png",
    ),
  ],
  SweepQueen: [
    pull(
      "sq-1",
      "Mew ex (151)",
      "Ancient Rare",
      38_000,
      "https://images.pokemontcg.io/me1/151_hires.png",
    ),
    pull(
      "sq-2",
      "Iron Valiant ex",
      "Ancient Rare",
      22_000,
      "https://images.pokemontcg.io/sv4/249_hires.png",
    ),
    pull(
      "sq-3",
      "Roaring Moon ex",
      "Ancient Rare",
      18_500,
      "https://images.pokemontcg.io/sv4/251_hires.png",
    ),
  ],
  "0xApe": [
    pull(
      "ape-1",
      "Pikachu VMAX (Rainbow Rare)",
      "Ancient Rare",
      34_000,
      "https://images.pokemontcg.io/swsh4/44_hires.png",
    ),
    pull(
      "ape-2",
      "Charizard (Base Set)",
      "Ancient Rare",
      28_000,
      "https://images.pokemontcg.io/base1/4_hires.png",
    ),
    pull(
      "ape-3",
      "Golisopod ex",
      "Rare",
      11_200,
      "https://images.pokemontcg.io/sv4/246_hires.png",
    ),
  ],
  NeonWolf: [
    pull(
      "nw-1",
      "Sandy Shocks ex",
      "Rare",
      14_800,
      "https://images.pokemontcg.io/sv4/250_hires.png",
    ),
    pull(
      "nw-2",
      "Iron Hands ex",
      "Rare",
      9_400,
      "https://images.pokemontcg.io/sv4/248_hires.png",
    ),
    pull(
      "nw-3",
      "Toedscruel",
      "Rare",
      5_600,
      "https://images.pokemontcg.io/sv4/185_hires.png",
    ),
  ],
  DropLord: [
    pull(
      "dl-1",
      "Garganacl",
      "Rare",
      2_400,
      "https://images.pokemontcg.io/sv4/104_hires.png",
    ),
    pull(
      "dl-2",
      "Sandy Shocks ex",
      "Rare",
      1_800,
      "https://images.pokemontcg.io/sv4/108_hires.png",
    ),
    pull(
      "dl-3",
      "Ting-Lu",
      "Common",
      650,
      "https://images.pokemontcg.io/sv4/109_hires.png",
    ),
  ],
  MoonRider: [
    pull(
      "mr-1",
      "Bombirdier ex",
      "Rare",
      4_200,
      "https://images.pokemontcg.io/sv4/234_hires.png",
    ),
    pull(
      "mr-2",
      "Garbodor",
      "Rare",
      2_850,
      "https://images.pokemontcg.io/sv4/204_hires.png",
    ),
    pull(
      "mr-3",
      "Armarouge ex",
      "Common",
      1_150,
      "https://images.pokemontcg.io/sv4/218_hires.png",
    ),
  ],
  PackFiend: [
    pull(
      "pf-1",
      "Bounsweet",
      "Common",
      1_800,
      "https://images.pokemontcg.io/sv4/8_hires.png",
    ),
    pull(
      "pf-2",
      "Crocalor",
      "Common",
      950,
      "https://images.pokemontcg.io/sv4/24_hires.png",
    ),
    pull(
      "pf-3",
      "Steenee",
      "Common",
      420,
      "https://images.pokemontcg.io/sv4/9_hires.png",
    ),
  ],
};
