import type { StoreItem } from "../types/store";
import { finalizeSportsPool } from "../constants/poolUtils";

/** Open-access basketball imagery — reliable in dev and production (no hotlink blocks). */
export const NBA_CARD_IMAGES = {
  wembanyama:
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&auto=format&fit=crop&q=80",
  luka:
    "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=500&auto=format&fit=crop&q=80",
  edwards:
    "https://images.unsplash.com/photo-1608245365846-99d65ee1a3b1?w=500&auto=format&fit=crop&q=80",
  lebron:
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=80",
} as const;

type NbaItemDraft = Omit<StoreItem, "probability" | "setId" | "setName" | "number">;

/** Full NBA hardwood catalog — probabilities assigned by `finalizeSportsPool`. */
const NBA_ITEM_DRAFTS: NbaItemDraft[] = [
  {
    id: "nba-m-lebron-rookie-psa10",
    name: "LeBron James 2003 Topps Chrome Rookie RC PSA 10",
    rarity: "Mythic",
    appRarity: "Ancient Rare",
    value: 10_000,
    image: NBA_CARD_IMAGES.lebron,
    tcgMarketUsd: 100,
  },
  {
    id: "nba-l-wembanyama-prizm-psa10",
    name: "Victor Wembanyama 2023 Prizm Silver RC PSA 10",
    rarity: "Legendary",
    appRarity: "Ancient Rare",
    value: 8_500,
    image: NBA_CARD_IMAGES.wembanyama,
    tcgMarketUsd: 85,
  },
  {
    id: "nba-l-luka-prizm-psa9",
    name: "Luka Dončić 2018 Panini Prizm Silver RC PSA 9",
    rarity: "Legendary",
    appRarity: "Ancient Rare",
    value: 7_200,
    image: NBA_CARD_IMAGES.luka,
    tcgMarketUsd: 72,
  },
  {
    id: "nba-l-edwards-optic-psa10",
    name: "Anthony Edwards 2020 Panini Optic Holo PSA 10",
    rarity: "Legendary",
    appRarity: "Ancient Rare",
    value: 6_000,
    image: NBA_CARD_IMAGES.edwards,
    tcgMarketUsd: 60,
  },
  {
    id: "nba-e-lebron-rookie-raw",
    name: "LeBron James 2003 Topps Chrome Rookie RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 4_500,
    image: NBA_CARD_IMAGES.lebron,
    tcgMarketUsd: 45,
  },
  {
    id: "nba-e-wembanyama-prizm-silver",
    name: "Victor Wembanyama 2023 Panini Prizm Silver RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 3_800,
    image: NBA_CARD_IMAGES.wembanyama,
    tcgMarketUsd: 38,
  },
  {
    id: "nba-e-luka-prizm-silver",
    name: "Luka Dončić 2018 Panini Prizm Silver RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 3_200,
    image: NBA_CARD_IMAGES.luka,
    tcgMarketUsd: 32,
  },
  {
    id: "nba-e-edwards-optic-holo",
    name: "Anthony Edwards 2020 Panini Optic Holo",
    rarity: "Epic",
    appRarity: "Rare",
    value: 2_600,
    image: NBA_CARD_IMAGES.edwards,
    tcgMarketUsd: 26,
  },
  {
    id: "nba-r-wembanyama-prizm-base",
    name: "Victor Wembanyama 2023 Prizm Base RC",
    rarity: "Rare",
    appRarity: "Rare",
    value: 1_400,
    image: NBA_CARD_IMAGES.wembanyama,
    tcgMarketUsd: 14,
  },
  {
    id: "nba-r-luka-prizm-base",
    name: "Luka Dončić 2018 Panini Prizm Base RC",
    rarity: "Rare",
    appRarity: "Rare",
    value: 1_100,
    image: NBA_CARD_IMAGES.luka,
    tcgMarketUsd: 11,
  },
  {
    id: "nba-r-edwards-optic-shock",
    name: "Anthony Edwards 2020 Optic Shock Parallel",
    rarity: "Rare",
    appRarity: "Rare",
    value: 900,
    image: NBA_CARD_IMAGES.edwards,
    tcgMarketUsd: 9,
  },
  {
    id: "nba-r-lebron-rookie-reprint",
    name: "LeBron James Topps Chrome Rookie Reprint",
    rarity: "Rare",
    appRarity: "Rare",
    value: 750,
    image: NBA_CARD_IMAGES.lebron,
    tcgMarketUsd: 7.5,
  },
  {
    id: "nba-c-wembanyama-hoops",
    name: "Victor Wembanyama 2023 Panini Hoops RC",
    rarity: "Common",
    appRarity: "Common",
    value: 180,
    image: NBA_CARD_IMAGES.wembanyama,
    tcgMarketUsd: 1.8,
  },
  {
    id: "nba-c-luka-donruss",
    name: "Luka Dončić 2018 Panini Donruss Rated Rookie",
    rarity: "Common",
    appRarity: "Common",
    value: 150,
    image: NBA_CARD_IMAGES.luka,
    tcgMarketUsd: 1.5,
  },
  {
    id: "nba-c-edwards-prizm",
    name: "Anthony Edwards 2020 Panini Prizm Base RC",
    rarity: "Common",
    appRarity: "Common",
    value: 130,
    image: NBA_CARD_IMAGES.edwards,
    tcgMarketUsd: 1.3,
  },
  {
    id: "nba-c-lebron-fleet",
    name: "LeBron James 2003 Fleer Tradition RC",
    rarity: "Common",
    appRarity: "Common",
    value: 100,
    image: NBA_CARD_IMAGES.lebron,
    tcgMarketUsd: 1,
  },
];

export const NBA_BOX_ITEMS: StoreItem[] = finalizeSportsPool(
  "nba",
  "Hardwood Legends",
  NBA_ITEM_DRAFTS,
);

/** Lobby / drop-table source of truth for NBA card rendering. */
export const NBA_CARDS_CATALOG: StoreItem[] = NBA_BOX_ITEMS;

export const NBA_ITEM_IDS: string[] = NBA_BOX_ITEMS.map((item) => item.id);

/** Maps catalog fields to the shared card shape — supports both `image` and `image_url`. */
export function nbaStoreItemToCard(item: StoreItem) {
  return {
    id: item.id,
    name: item.name,
    rarity: item.appRarity,
    value: item.value,
    image: item.image,
    image_url: item.image,
  };
}

const MYTHIC = ["nba-m-lebron-rookie-psa10"] as const;
const LEGENDARY = [
  "nba-l-wembanyama-prizm-psa10",
  "nba-l-luka-prizm-psa9",
  "nba-l-edwards-optic-psa10",
] as const;
const EPIC = [
  "nba-e-lebron-rookie-raw",
  "nba-e-wembanyama-prizm-silver",
  "nba-e-luka-prizm-silver",
  "nba-e-edwards-optic-holo",
] as const;
const RARE = [
  "nba-r-wembanyama-prizm-base",
  "nba-r-luka-prizm-base",
  "nba-r-edwards-optic-shock",
  "nba-r-lebron-rookie-reprint",
] as const;
const COMMON = [
  "nba-c-wembanyama-hoops",
  "nba-c-luka-donruss",
  "nba-c-edwards-prizm",
  "nba-c-lebron-fleet",
] as const;

/** Per-box whitelists — gem values scale with box cost (500 → 10,000). */
export const NBA_BOX_POOLS: Record<string, readonly string[]> = {
  "rookie-wire-starter": [...COMMON, ...RARE],
  "prizm-silver-surge": [...COMMON, ...RARE, ...EPIC],
  "court-side-autograph": [...RARE, ...EPIC, ...LEGENDARY],
  "playoff-pressure": [
    ...COMMON,
    ...RARE,
    ...EPIC,
    ...LEGENDARY,
  ],
  "all-star-hardwood": NBA_ITEM_IDS,
  "dynasty-chrome-vault": [...EPIC, ...LEGENDARY, ...MYTHIC],
  "hardwood-grail-hunter": [...LEGENDARY, ...MYTHIC],
};
