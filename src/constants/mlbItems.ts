import type { StoreItem } from "../types/store";
import { finalizeSportsPool } from "./poolUtils";
import { SPORTS_PLACEHOLDER_IMAGE } from "./sportsAssets";

/** MLB baseball only — local slab art; swap paths when assets are added. */
export const MLB_ITEMS: StoreItem[] = finalizeSportsPool("mlb", "Diamond Vault", [
  {
    id: "mlb-m-ohtani-bowman",
    name: "Shohei Ohtani 2018 Bowman Chrome Auto PSA 10",
    rarity: "Mythic",
    appRarity: "Ancient Rare",
    value: 85_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 850,
  },
  {
    id: "mlb-l-trout-update",
    name: "Mike Trout 2009 Bowman Chrome Draft RC PSA 10",
    rarity: "Legendary",
    appRarity: "Ancient Rare",
    value: 68_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 680,
  },
  {
    id: "mlb-l-judge-bowman",
    name: "Aaron Judge 2013 Bowman Chrome RC PSA 10",
    rarity: "Legendary",
    appRarity: "Ancient Rare",
    value: 42_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 420,
  },
  {
    id: "mlb-e-soto-chrome",
    name: "Juan Soto 2016 Bowman Chrome RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 5_200,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 52,
  },
  {
    id: "mlb-e-acuna-chrome",
    name: "Ronald Acuña Jr. 2017 Bowman Chrome RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 4_600,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 46,
  },
  {
    id: "mlb-r-degrom-topps",
    name: "Jacob deGrom 2014 Topps Chrome RC",
    rarity: "Rare",
    appRarity: "Rare",
    value: 2_900,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 29,
  },
  {
    id: "mlb-r-tatis-chrome",
    name: "Fernando Tatís Jr. 2019 Bowman Chrome RC",
    rarity: "Rare",
    appRarity: "Rare",
    value: 3_100,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 31,
  },
  {
    id: "mlb-r-riley-chrome",
    name: "Austin Riley 2018 Bowman Chrome RC",
    rarity: "Rare",
    appRarity: "Rare",
    value: 1_950,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 19.5,
  },
  {
    id: "mlb-c-witt-bowman",
    name: "Bobby Witt Jr. 2020 Bowman Chrome RC",
    rarity: "Common",
    appRarity: "Common",
    value: 140,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 1.4,
  },
  {
    id: "mlb-c-alonso-topps",
    name: "Pete Alonso 2019 Topps Series 1 RC",
    rarity: "Common",
    appRarity: "Common",
    value: 55,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 0.55,
  },
]);

export const MLB_ITEM_IDS: string[] = MLB_ITEMS.map((item) => item.id);
