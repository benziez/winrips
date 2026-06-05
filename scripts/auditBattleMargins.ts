/**
 * Temporary audit — Pack Battles economy margins by pack tier.
 *
 * Run: npx ts-node scripts/auditBattleMargins.ts
 *      (or: npx tsx scripts/auditBattleMargins.ts)
 */
import type { Pack } from "../src/types";
import { getPackStoreItems } from "../src/constants/catalog";
import { computePackExpectedValue } from "../src/utils/packProbability";
import { gemsToUsd } from "../src/constants/retail";
import {
  EVOLVING_SKIES_ITEM_IDS,
  FLASH_ITEM_IDS,
  GOD_PACK_1999_ITEM_IDS,
  LEGENDARY_HUNT_ITEM_IDS,
  MEGA_EVOLUTION_ITEM_IDS,
  MIDNIGHT_GRAIL_ITEM_IDS,
  OBSIDIAN_VAULT_ITEM_IDS,
  PACK_151_ITEM_IDS,
  POWER_HOUR_ITEM_IDS,
  PRISMATIC_SIR_ITEM_IDS,
  PSA_10_CHASER_ITEM_IDS,
  SHINY_VAULT_ITEM_IDS,
  TRAINERS_STARTER_ITEM_IDS,
  WAIFU_VAULT_ITEM_IDS,
  WEEKEND_WARRIOR_ITEM_IDS,
  WOTC_FIRST_EDITION_ITEM_IDS,
} from "../src/constants/packPokemonPools";

const WIN_RATE = 0.5;

/** Catalog packs backed by pools in packPokemonPools.ts (matches buildPokemonPacks costs). */
const AUDIT_PACKS: Array<Pick<Pack, "id" | "name" | "cost" | "items">> = [
  { id: "trainers-starter", name: "Trainer's Starter Pack", cost: 100, items: [...TRAINERS_STARTER_ITEM_IDS] },
  { id: "151-booster-collector", name: "151 Booster Collector", cost: 1_000, items: [...PACK_151_ITEM_IDS] },
  { id: "shiny-vault", name: "The Shiny Vault", cost: 1_500, items: [...SHINY_VAULT_ITEM_IDS] },
  { id: "mega-evolution", name: "Mega Evolution EX", cost: 1_500, items: [...MEGA_EVOLUTION_ITEM_IDS] },
  { id: "flash", name: "Flash Pack", cost: 2_000, items: [...FLASH_ITEM_IDS] },
  { id: "waifu-vault", name: "Trainer Gallery", cost: 2_500, items: [...WAIFU_VAULT_ITEM_IDS] },
  { id: "legendary-hunt", name: "Legendary Hunt", cost: 2_500, items: [...LEGENDARY_HUNT_ITEM_IDS] },
  { id: "power-hour", name: "Power Hour", cost: 3_000, items: [...POWER_HOUR_ITEM_IDS] },
  { id: "prismatic-sir", name: "Prismatic Special SIR", cost: 4_500, items: [...PRISMATIC_SIR_ITEM_IDS] },
  { id: "psa-10-chaser", name: "The PSA 10 Chaser", cost: 5_000, items: [...PSA_10_CHASER_ITEM_IDS] },
  { id: "weekend-warrior", name: "Weekend Warrior", cost: 5_000, items: [...WEEKEND_WARRIOR_ITEM_IDS] },
  { id: "evolving-skies", name: "Evolving Skies Chase", cost: 6_500, items: [...EVOLVING_SKIES_ITEM_IDS] },
  { id: "midnight-grail", name: "Midnight Grail", cost: 7_500, items: [...MIDNIGHT_GRAIL_ITEM_IDS] },
  { id: "obsidian-vault", name: "The Obsidian Vault", cost: 10_000, items: [...OBSIDIAN_VAULT_ITEM_IDS] },
  { id: "god-pack-1999", name: "The 1999 God Pack", cost: 15_000, items: [...GOD_PACK_1999_ITEM_IDS] },
  { id: "wotc-first-edition", name: "WOTC 1st Edition Classic", cost: 45_000, items: [...WOTC_FIRST_EDITION_ITEM_IDS] },
];

function toPack(entry: (typeof AUDIT_PACKS)[number]): Pack {
  return {
    ...entry,
    theme: "gold",
    description: "",
    category: "pokemon",
    image: "",
  };
}

function fmtUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount >= 100 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function avgBattleRewardCostUsd(packPriceUsd: number, bonusRate: number): number {
  return packPriceUsd * bonusRate * WIN_RATE;
}

interface AuditRow {
  name: string;
  priceUsd: number;
  evUsd: number;
  baseMarginUsd: number;
  net5Usd: number;
  net2Usd: number;
}

function auditPack(entry: (typeof AUDIT_PACKS)[number]): AuditRow {
  const pack = toPack(entry);
  const items = getPackStoreItems(pack);
  const evGems = computePackExpectedValue(items);
  const priceUsd = gemsToUsd(pack.cost);
  const evUsd = gemsToUsd(evGems);
  const baseMarginUsd = priceUsd - evUsd;
  const net5Usd = baseMarginUsd - avgBattleRewardCostUsd(priceUsd, 0.05);
  const net2Usd = baseMarginUsd - avgBattleRewardCostUsd(priceUsd, 0.02);

  return {
    name: entry.name,
    priceUsd,
    evUsd,
    baseMarginUsd,
    net5Usd,
    net2Usd,
  };
}

function padEnd(str: string, width: number): string {
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

function padStart(str: string, width: number): string {
  return str.length >= width ? str : " ".repeat(width - str.length) + str;
}

function main(): void {
  const rows = AUDIT_PACKS.map(auditPack).sort((a, b) => a.priceUsd - b.priceUsd);

  const nameWidth = Math.max("Pack Name".length, ...rows.map((r) => r.name.length));
  const moneyWidth = 14;

  console.log("# Pack Battles Economy Audit\n");
  console.log(
    "Assumptions: normalized roll weights via `getPackStoreItems` / `applyValueScaledProbabilities`, " +
      "50% win rate, win bonus paid only on victories, EV in USD (100 gems = $1).\n",
  );

  console.log(
    `| ${padEnd("Pack Name", nameWidth)} | ${padStart("Price", moneyWidth)} | ${padStart("Base Margin", moneyWidth)} | ${padStart("5% Net Profit", moneyWidth)} | ${padStart("2% Net Profit", moneyWidth)} |`,
  );
  console.log(
    `| ${"-".repeat(nameWidth)} | ${"-".repeat(moneyWidth)} | ${"-".repeat(moneyWidth)} | ${"-".repeat(moneyWidth)} | ${"-".repeat(moneyWidth)} |`,
  );

  for (const row of rows) {
    console.log(
      `| ${padEnd(row.name, nameWidth)} | ${padStart(fmtUsd(row.priceUsd), moneyWidth)} | ${padStart(fmtUsd(row.baseMarginUsd), moneyWidth)} | ${padStart(fmtUsd(row.net5Usd), moneyWidth)} | ${padStart(fmtUsd(row.net2Usd), moneyWidth)} |`,
    );
  }

  const totals = rows.reduce(
    (acc, row) => ({
      priceUsd: acc.priceUsd + row.priceUsd,
      baseMarginUsd: acc.baseMarginUsd + row.baseMarginUsd,
      net5Usd: acc.net5Usd + row.net5Usd,
      net2Usd: acc.net2Usd + row.net2Usd,
    }),
    { priceUsd: 0, baseMarginUsd: 0, net5Usd: 0, net2Usd: 0 },
  );

  console.log(
    `| ${padEnd("AVERAGE (unweighted)", nameWidth)} | ${padStart(fmtUsd(totals.priceUsd / rows.length), moneyWidth)} | ${padStart(fmtUsd(totals.baseMarginUsd / rows.length), moneyWidth)} | ${padStart(fmtUsd(totals.net5Usd / rows.length), moneyWidth)} | ${padStart(fmtUsd(totals.net2Usd / rows.length), moneyWidth)} |`,
  );

  console.log(
    "\nNote: live `battleWinBonusCents` currently awards **15%** of pack price on wins — not 5% or 2%.",
  );
}

main();
