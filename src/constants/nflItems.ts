import type { StoreItem } from "../types/store";
import { finalizeSportsPool } from "./poolUtils";
import { SPORTS_PLACEHOLDER_IMAGE } from "./sportsAssets";

/** NFL football only — local slab art; swap paths when assets are added. */
export const NFL_ITEMS: StoreItem[] = finalizeSportsPool("nfl", "Gridiron Vault", [
  {
    id: "nfl-m-mahomes-prizm",
    name: "Patrick Mahomes 2017 Panini Prizm RC PSA 10",
    rarity: "Mythic",
    appRarity: "Ancient Rare",
    value: 80_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 800,
  },
  {
    id: "nfl-l-brady-ticket-slab",
    name: "Tom Brady Championship Ticket Graded Slab",
    rarity: "Legendary",
    appRarity: "Ancient Rare",
    value: 55_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 550,
  },
  {
    id: "nfl-l-burrow-prizm",
    name: "Joe Burrow 2020 Panini Prizm Silver RC",
    rarity: "Legendary",
    appRarity: "Ancient Rare",
    value: 20_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 200,
  },
  {
    id: "nfl-e-lamar-prizm",
    name: "Lamar Jackson 2018 Panini Prizm RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 4_500,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 45,
  },
  {
    id: "nfl-e-allen-prizm",
    name: "Josh Allen 2018 Panini Prizm RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 4_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 40,
  },
  {
    id: "nfl-e-jefferson-prizm",
    name: "Justin Jefferson 2020 Panini Prizm RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 3_800,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 38,
  },
  {
    id: "nfl-r-chase-optic",
    name: "Ja'Marr Chase 2021 Panini Optic Holo",
    rarity: "Rare",
    appRarity: "Rare",
    value: 3_400,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 34,
  },
  {
    id: "nfl-r-hill-select",
    name: "Tyreek Hill 2016 Panini Select Courtside",
    rarity: "Rare",
    appRarity: "Rare",
    value: 1_850,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 18.5,
  },
  {
    id: "nfl-r-herbert-optic",
    name: "Justin Herbert 2020 Panini Optic Holo",
    rarity: "Rare",
    appRarity: "Rare",
    value: 2_200,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 22,
  },
  {
    id: "nfl-c-minshew-donruss",
    name: "Gardner Minshew 2019 Panini Donruss Base",
    rarity: "Common",
    appRarity: "Common",
    value: 48,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 0.48,
  },
]);

export const NFL_ITEM_IDS: string[] = NFL_ITEMS.map((item) => item.id);
