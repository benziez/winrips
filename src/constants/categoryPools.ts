import type { StoreItem } from "../types/store";
import { finalizeSportsPool } from "./poolUtils";

const YGO_IMG = (id: number) => `https://images.ygoprodeck.com/images/cards/${id}.jpg`;

/** Shared staples for budget / mid-tier Yu-Gi-Oh lobby boxes (no vault or rite exclusives). */
export const YUGIOH_GENERAL_POOL: StoreItem[] = finalizeSportsPool("yugioh", "Duelist Vault", [
  {
    id: "ygo-e1",
    name: "Black Luster Soldier Envoy",
    rarity: "Epic",
    appRarity: "Rare",
    value: 2_400,
    image: YGO_IMG(24094653),
    tcgMarketUsd: 24,
  },
  {
    id: "ygo-e2",
    name: "Elemental HERO Stratos Ultimate",
    rarity: "Epic",
    appRarity: "Rare",
    value: 2_100,
    image: YGO_IMG(40044918),
    tcgMarketUsd: 21,
  },
  {
    id: "ygo-r1",
    name: "Pot of Greed 1st Ed",
    rarity: "Rare",
    appRarity: "Rare",
    value: 1_900,
    image: YGO_IMG(53129443),
    tcgMarketUsd: 19,
  },
  {
    id: "ygo-r2",
    name: "Stardust Dragon Holo",
    rarity: "Rare",
    appRarity: "Rare",
    value: 1_700,
    image: YGO_IMG(44519536),
    tcgMarketUsd: 17,
  },
  {
    id: "ygo-c1",
    name: "Common Spell Card Lot",
    rarity: "Common",
    appRarity: "Common",
    value: 35,
    image: YGO_IMG(5318639),
    tcgMarketUsd: 0.35,
  },
  {
    id: "ygo-c2",
    name: "Duelist Kingdom Promo",
    rarity: "Common",
    appRarity: "Common",
    value: 45,
    image: YGO_IMG(66788016),
    tcgMarketUsd: 0.45,
  },
  {
    id: "ygo-c3",
    name: "Starter Deck Common",
    rarity: "Common",
    appRarity: "Common",
    value: 30,
    image: YGO_IMG(83764719),
    tcgMarketUsd: 0.3,
  },
]);

/** Duelist's Secret Vault — iconic retro powerhouse singles only. */
export const DUELISTS_VAULT_ITEMS: StoreItem[] = finalizeSportsPool(
  "yugioh",
  "Duelist's Secret Vault",
  [
    {
      id: "ygo-v-blue-eyes",
      name: "Blue-Eyes White Dragon",
      rarity: "Mythic",
      appRarity: "Ancient Rare",
      value: 75_000,
      image: YGO_IMG(89631139),
      tcgMarketUsd: 750,
    },
    {
      id: "ygo-v-dark-magician",
      name: "Dark Magician",
      rarity: "Legendary",
      appRarity: "Ancient Rare",
      value: 40_000,
      image: YGO_IMG(46986414),
      tcgMarketUsd: 400,
    },
    {
      id: "ygo-v-red-eyes",
      name: "Red-Eyes Black Dragon",
      rarity: "Legendary",
      appRarity: "Ancient Rare",
      value: 28_000,
      image: YGO_IMG(74677422),
      tcgMarketUsd: 280,
    },
    {
      id: "ygo-v-summoned-skull",
      name: "Summoned Skull",
      rarity: "Epic",
      appRarity: "Rare",
      value: 3_200,
      image: YGO_IMG(70781052),
      tcgMarketUsd: 32,
    },
    {
      id: "ygo-v-time-wizard",
      name: "Time Wizard",
      rarity: "Rare",
      appRarity: "Rare",
      value: 1_400,
      image: YGO_IMG(71625222),
      tcgMarketUsd: 14,
    },
  ],
);

/** Forbidden Rite Edition — Exodia limbs, Jinzo, and Cyber Dragon grails only. */
export const FORBIDDEN_RITE_ITEMS: StoreItem[] = finalizeSportsPool(
  "yugioh",
  "Forbidden Rite Edition",
  [
    {
      id: "ygo-f-exodia-head",
      name: "Exodia the Forbidden One",
      rarity: "Mythic",
      appRarity: "Ancient Rare",
      value: 90_000,
      image: YGO_IMG(33396948),
      tcgMarketUsd: 900,
    },
    {
      id: "ygo-f-exodia-l-arm",
      name: "Left Arm of the Forbidden One",
      rarity: "Legendary",
      appRarity: "Ancient Rare",
      value: 22_000,
      image: YGO_IMG(90960308),
      tcgMarketUsd: 220,
    },
    {
      id: "ygo-f-exodia-r-arm",
      name: "Right Arm of the Forbidden One",
      rarity: "Legendary",
      appRarity: "Ancient Rare",
      value: 22_000,
      image: YGO_IMG(90832352),
      tcgMarketUsd: 220,
    },
    {
      id: "ygo-f-exodia-l-leg",
      name: "Left Leg of the Forbidden One",
      rarity: "Legendary",
      appRarity: "Ancient Rare",
      value: 20_000,
      image: YGO_IMG(44330098),
      tcgMarketUsd: 200,
    },
    {
      id: "ygo-f-exodia-r-leg",
      name: "Right Leg of the Forbidden One",
      rarity: "Legendary",
      appRarity: "Ancient Rare",
      value: 20_000,
      image: YGO_IMG(8124921),
      tcgMarketUsd: 200,
    },
    {
      id: "ygo-f-jinzo",
      name: "Jinzo",
      rarity: "Epic",
      appRarity: "Rare",
      value: 4_500,
      image: YGO_IMG(77585513),
      tcgMarketUsd: 45,
    },
    {
      id: "ygo-f-cyber-dragon",
      name: "Cyber Dragon",
      rarity: "Epic",
      appRarity: "Rare",
      value: 3_800,
      image: YGO_IMG(70095154),
      tcgMarketUsd: 38,
    },
  ],
);

/** Full Yu-Gi-Oh storefront catalog — general staples plus pack-exclusive pools. */
export const YUGIOH_POOL: StoreItem[] = [
  ...YUGIOH_GENERAL_POOL,
  ...DUELISTS_VAULT_ITEMS,
  ...FORBIDDEN_RITE_ITEMS,
];

export const DUELISTS_VAULT_ITEM_IDS: string[] = DUELISTS_VAULT_ITEMS.map((item) => item.id);
export const FORBIDDEN_RITE_ITEM_IDS: string[] = FORBIDDEN_RITE_ITEMS.map((item) => item.id);

export const EXODIA_PIECE_ITEM_IDS: string[] = FORBIDDEN_RITE_ITEMS.filter((item) =>
  item.id.startsWith("ygo-f-exodia"),
).map((item) => item.id);

export const YUGIOH_ITEM_IDS: string[] = YUGIOH_POOL.map((item) => item.id);
