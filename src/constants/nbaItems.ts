import type { StoreItem } from "../types/store";
import { finalizeSportsPool } from "./poolUtils";
import { SPORTS_PLACEHOLDER_IMAGE } from "./sportsAssets";

/** NBA basketball only — local slab art; swap paths when assets are added. */
export const NBA_ITEMS: StoreItem[] = finalizeSportsPool("nba", "Hardwood Legends", [
  {
    id: "nba-m-lebron-graded",
    name: "LeBron James Prizm PSA 10 Graded Slab",
    rarity: "Mythic",
    appRarity: "Ancient Rare",
    value: 75_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 750,
  },
  {
    id: "nba-l-kobe-patch-auto",
    name: "Kobe Bryant Patch Auto PSA Slab",
    rarity: "Legendary",
    appRarity: "Ancient Rare",
    value: 62_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 620,
  },
  {
    id: "nba-e-wembanyama-prizm",
    name: "Victor Wembanyama 2023 Panini Prizm Silver RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 5_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 50,
  },
  {
    id: "nba-e-luka-prizm",
    name: "Luka Dončić 2018 Panini Prizm Silver RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 4_200,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 42,
  },
  {
    id: "nba-e-giannis-prizm",
    name: "Giannis Antetokounmpo 2018 Panini Prizm RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 4_800,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 48,
  },
  {
    id: "nba-r-curry-downtown",
    name: "Stephen Curry 2009 Upper Deck Downtown",
    rarity: "Rare",
    appRarity: "Rare",
    value: 3_600,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 36,
  },
  {
    id: "nba-r-tatum-mosaic",
    name: "Jayson Tatum 2017 Panini Mosaic RC",
    rarity: "Rare",
    appRarity: "Rare",
    value: 2_800,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 28,
  },
  {
    id: "nba-r-edwards-optic",
    name: "Anthony Edwards 2020 Panini Optic Holo",
    rarity: "Rare",
    appRarity: "Rare",
    value: 2_100,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 21,
  },
  {
    id: "nba-c-banchero-prizm",
    name: "Paolo Banchero 2022 Panini Prizm RC",
    rarity: "Common",
    appRarity: "Common",
    value: 120,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 1.2,
  },
  {
    id: "nba-c-payton-pritchard",
    name: "Payton Pritchard 2020 Panini Hoops Base",
    rarity: "Common",
    appRarity: "Common",
    value: 45,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 0.45,
  },
]);

export const NBA_ITEM_IDS: string[] = NBA_ITEMS.map((item) => item.id);
