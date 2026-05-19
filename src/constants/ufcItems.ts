import type { StoreItem } from "../types/store";
import { finalizeSportsPool } from "./poolUtils";
import { SPORTS_PLACEHOLDER_IMAGE } from "./sportsAssets";

/** UFC / MMA only — local slab art; swap paths when assets are added. */
export const UFC_ITEMS: StoreItem[] = finalizeSportsPool("ufc", "Octagon Relics", [
  {
    id: "ufc-m-jones-prizm-auto",
    name: "Jon Jones Panini Prizm Auto PSA Graded Slab",
    rarity: "Mythic",
    appRarity: "Ancient Rare",
    value: 65_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 650,
  },
  {
    id: "ufc-l-mcgregor-chrome-auto",
    name: "Conor McGregor Chrome Autograph PSA Slab",
    rarity: "Legendary",
    appRarity: "Ancient Rare",
    value: 42_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 420,
  },
  {
    id: "ufc-l-khabib-prizm",
    name: "Khabib Nurmagomedov 2018 Panini Prizm RC",
    rarity: "Legendary",
    appRarity: "Ancient Rare",
    value: 28_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 280,
  },
  {
    id: "ufc-e-adesanya-chrome",
    name: "Israel Adesanya 2019 Topps UFC Chrome RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 2_400,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 24,
  },
  {
    id: "ufc-e-pereira-chrome",
    name: "Alex Pereira 2021 Panini UFC Chrome RC",
    rarity: "Epic",
    appRarity: "Rare",
    value: 2_000,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 20,
  },
  {
    id: "ufc-r-nunes-auto",
    name: "Amanda Nunes 2014 Panini UFC Auto",
    rarity: "Rare",
    appRarity: "Rare",
    value: 1_750,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 17.5,
  },
  {
    id: "ufc-r-holloway-prizm",
    name: "Max Holloway 2018 Panini UFC Prizm",
    rarity: "Rare",
    appRarity: "Rare",
    value: 1_550,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 15.5,
  },
  {
    id: "ufc-r-volkanovski-chrome",
    name: "Alexander Volkanovski 2019 Panini UFC Chrome",
    rarity: "Rare",
    appRarity: "Rare",
    value: 1_400,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 14,
  },
  {
    id: "ufc-c-poirier-base",
    name: "Dustin Poirier 2013 Panini UFC Base",
    rarity: "Common",
    appRarity: "Common",
    value: 32,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 0.32,
  },
  {
    id: "ufc-c-omalley-chrome",
    name: "Sean O'Malley 2020 Panini UFC Chrome",
    rarity: "Common",
    appRarity: "Common",
    value: 38,
    image: SPORTS_PLACEHOLDER_IMAGE,
    tcgMarketUsd: 0.38,
  },
]);

export const UFC_ITEM_IDS: string[] = UFC_ITEMS.map((item) => item.id);
