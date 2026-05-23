#!/usr/bin/env node
/**
 * Fetches Paradox Rift (sv4) cards from the Pokémon TCG API and writes
 * src/constants/items.ts with MOCK_ITEMS.pokemon + drop probabilities.
 *
 * Usage: npm run seed:pokemon
 * Optional: POKEMON_TCG_API_KEY=your_key (https://dev.pokemontcg.io)
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT = join(ROOT, "src/constants/pokemonCatalog.ts");

const API_BASE = "https://api.pokemontcg.io/v2/cards";
/** Pokémon cards only — excludes Trainers, Energy, and Code Cards at the API layer. */
const SET_QUERY = "set.id:sv4 supertype:Pokémon";
const GEMS_PER_USD = 100;
const MIN_COMMON_GEMS = 30;
const PAGE_SIZE = 250;

/** Total % budget per tier (must sum to 100). */
const TIER_WEIGHT_BUDGET = {
  Mythic: 0.3,
  Legendary: 2.2,
  Epic: 7.5,
  Rare: 17,
  Common: 73,
};

const MYTHIC_KEYWORDS = [/charizard/i, /garchomp/i, /iron valiant/i, /roaring moon/i];

const BLOCKED_NAME_PATTERNS = [/code card/i, /\benergy\b/i, /\bbasic energy\b/i, /\bspecial energy\b/i];

/** Mirrors src/lib/pokemonApi.ts — keep in sync when changing storefront rules. */
function isCollectiblePokemonApiCard(card) {
  if (card.supertype !== "Pokémon") return false;

  const name = card.name?.trim() ?? "";
  if (!name || BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(name))) {
    return false;
  }

  const large = card.images?.large?.trim();
  if (!large) return false;

  return true;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getMarketUsd(card) {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  const keys = [
    "holofoil",
    "reverseHolofoil",
    "normal",
    "1stEditionHolofoil",
    "1stEditionNormal",
  ];

  let best = null;
  for (const key of keys) {
    const market = prices[key]?.market;
    if (market == null) continue;
    const n = Number(market);
    if (!Number.isFinite(n)) continue;
    if (best == null || n > best) best = n;
  }
  return best;
}

function classifyTier(card, marketUsd) {
  const apiRarity = card.rarity ?? "";
  const name = card.name ?? "";
  const isAltArt =
    /special illustration rare/i.test(apiRarity) ||
    /illustration rare/i.test(apiRarity) ||
    /hyper rare/i.test(apiRarity);

  if (/hyper rare/i.test(apiRarity)) return "Mythic";
  if (MYTHIC_KEYWORDS.some((re) => re.test(name)) && isAltArt) return "Mythic";
  if (/special illustration rare/i.test(apiRarity)) return "Mythic";
  if (/ultra rare/i.test(apiRarity) || /secret/i.test(apiRarity)) return "Legendary";
  if (/illustration rare/i.test(apiRarity) || /double rare/i.test(apiRarity)) return "Epic";
  if (/rare holo/i.test(apiRarity) || /^rare$/i.test(apiRarity) || /rare$/i.test(apiRarity)) {
    if (marketUsd != null && marketUsd >= 15) return "Epic";
    return "Rare";
  }
  if (/uncommon/i.test(apiRarity)) return "Common";
  if (/common/i.test(apiRarity)) return "Common";

  if (marketUsd != null) {
    if (marketUsd >= 200) return "Mythic";
    if (marketUsd >= 75) return "Legendary";
    if (marketUsd >= 15) return "Epic";
    if (marketUsd >= 2) return "Rare";
    return "Common";
  }

  return "Common";
}

function tierToAppRarity(tier) {
  if (tier === "Mythic" || tier === "Legendary") return "Ancient Rare";
  if (tier === "Epic" || tier === "Rare") return "Rare";
  return "Common";
}

function usdToGems(usd, tier) {
  if (usd == null || !Number.isFinite(usd)) {
    const fallback = {
      Mythic: 62_000,
      Legendary: 35_000,
      Epic: 2_500,
      Rare: 1_800,
      Common: MIN_COMMON_GEMS,
    };
    return fallback[tier];
  }

  let gems = Math.round(usd * GEMS_PER_USD);

  if (tier === "Common") gems = Math.max(MIN_COMMON_GEMS, gems);
  if (tier === "Mythic") gems = Math.max(50_000, Math.min(gems, 75_000));
  if (tier === "Legendary") gems = Math.max(25_000, Math.min(gems, 50_000));
  if (tier === "Epic") gems = Math.max(1_500, Math.min(gems, 2_500));
  if (tier === "Rare") gems = Math.max(1_500, Math.min(gems, 2_500));

  return gems;
}

function escapeString(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function assignProbabilities(items) {
  const byTier = /** @type {Record<string, typeof items>} */ ({});
  for (const item of items) {
    if (!byTier[item.rarity]) byTier[item.rarity] = [];
    byTier[item.rarity].push(item);
  }

  for (const [tier, budget] of Object.entries(TIER_WEIGHT_BUDGET)) {
    const pool = byTier[tier] ?? [];
    if (pool.length === 0) continue;

    const each = budget / pool.length;
    for (const item of pool) {
      item.probability = Math.round(each * 1000) / 1000;
    }
  }

  const sum = items.reduce((a, i) => a + i.probability, 0);
  const drift = Math.round((100 - sum) * 1000) / 1000;
  if (drift !== 0 && items.length > 0) {
    const commons = items.filter((i) => i.rarity === "Common");
    const target = commons.length > 0 ? commons[0] : items[0];
    target.probability = Math.round((target.probability + drift) * 1000) / 1000;
  }
}

async function fetchAllCards() {
  const apiKey = process.env.POKEMON_TCG_API_KEY;
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;

  /** @type {any[]} */
  const all = [];
  let page = 1;
  let totalCount = Infinity;

  while ((page - 1) * PAGE_SIZE < totalCount) {
    const url = `${API_BASE}?q=${encodeURIComponent(SET_QUERY)}&pageSize=${PAGE_SIZE}&page=${page}`;
    console.log(`Fetching page ${page}…`);

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Pokémon TCG API ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    totalCount = json.totalCount ?? json.count ?? 0;
    const batch = json.data ?? [];
    all.push(...batch);

    if (batch.length === 0) break;
    page += 1;
    if (page > 20) break;
    await sleep(350);
  }

  return all.filter(isCollectiblePokemonApiCard);
}

function buildStoreItems(apiCards) {
  /** @type {any[]} */
  const items = [];

  for (const card of apiCards) {
    if (!isCollectiblePokemonApiCard(card)) continue;

    const image = card.images.large.trim();

    const marketUsd = getMarketUsd(card);
    const rarity = classifyTier(card, marketUsd);
    const value = usdToGems(marketUsd, rarity);

    items.push({
      id: `pk-${card.id.replace(/[^a-zA-Z0-9-]/g, "-")}`,
      name: card.name,
      rarity,
      appRarity: tierToAppRarity(rarity),
      value,
      image,
      probability: 0,
      tcgMarketUsd: marketUsd ?? 0,
      setId: card.set?.id ?? "sv4",
      setName: card.set?.name ?? "Paradox Rift",
      number: card.number ?? "",
    });
  }

  items.sort((a, b) => b.value - a.value);
  assignProbabilities(items);
  return items;
}

function formatItem(item) {
  return `    {
      id: "${escapeString(item.id)}",
      name: "${escapeString(item.name)}",
      rarity: "${item.rarity}",
      appRarity: "${item.appRarity}",
      value: ${item.value},
      image: "${escapeString(item.image)}",
      probability: ${item.probability},
      tcgMarketUsd: ${item.tcgMarketUsd},
      setId: "${escapeString(item.setId)}",
      setName: "${escapeString(item.setName)}",
      number: "${escapeString(item.number)}",
    }`;
}

function generateTypeScript(items) {
  const tierCounts = items.reduce((acc, i) => {
    acc[i.rarity] = (acc[i.rarity] ?? 0) + 1;
    return acc;
  }, {});

  const probSum = items.reduce((a, i) => a + i.probability, 0);

  const header = `/**
 * AUTO-GENERATED by scripts/seedPokemon.js — do not edit by hand.
 * Re-run: npm run seed:pokemon
 *
 * Source: Pokémon TCG API (${SET_QUERY})
 * Cards: ${items.length} | Probability sum: ${probSum.toFixed(2)}%
 * Tiers: ${JSON.stringify(tierCounts)}
 */
import type { StoreItem } from "../types/store";

/** Pokémon-only seed output — full catalog lives in \`catalog.ts\`. */
export const MOCK_ITEMS = {
  pokemon: [
`;

  const footer = `];

export function storeItemToCard(item: StoreItem) {
  return {
    id: item.id,
    name: item.name,
    rarity: item.appRarity,
    value: item.value,
    image: item.image,
  };
}

export const POKEMON_CARD_POOL = POKEMON_ITEMS.map(storeItemToCard);

export const POKEMON_DROP_ENTRIES = POKEMON_ITEMS.map((item) => ({
  cardId: item.id,
  probability: item.probability,
}));

`;

  return header + items.map(formatItem).join(",\n") + footer;
}

async function main() {
  console.log("Seeding Pokémon catalog from", SET_QUERY);

  const apiCards = await fetchAllCards();
  console.log(`Received ${apiCards.length} collectible Pokémon cards from API`);

  const items = buildStoreItems(apiCards);
  if (items.length === 0) {
    throw new Error("No cards with images were mapped — check API connectivity.");
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  const source = generateTypeScript(items);
  writeFileSync(OUTPUT, source, "utf8");

  const tiers = items.reduce((acc, i) => {
    acc[i.rarity] = (acc[i.rarity] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Wrote ${items.length} items → ${OUTPUT}`);
  console.log("Tier distribution:", tiers);
  console.log(
    "Sample mythic:",
    items.find((i) => i.rarity === "Mythic")?.name ?? items[0]?.name,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
