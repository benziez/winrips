import type { Card, PackCategory } from "../types";
import type { StoreItem } from "../types/store";
import {
  findPackById,
  findStaticPackById,
  getPackRollPool,
} from "../data/boxCatalog";
import { getPackDropTable } from "../data/packDropTables";
import {
  cardPoolForCategory,
  getPackStoreItems,
  storeItemToCard,
} from "../constants/catalog";
import { POKEMON_ITEMS } from "../constants/pokemonCatalog";
import { logger } from "../lib/logger";
import {
  normalizePackWeights,
  PROBABILITY_TOTAL,
} from "./packProbability";
import { applyRiskyRipMultipliers } from "./riskyRipOdds";

export { normalizePackWeights } from "./packProbability";

function secureRandomUnit(): number {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0]! / 0x1_0000_0000;
}

function secureRandomIndex(length: number): number {
  return Math.floor(secureRandomUnit() * length);
}

export interface WeightedRollResult<T> {
  item: T;
  /** Raw RNG draw on the 0–100 probability scale used for weighted selection. */
  rolledNumber: number;
}

/**
 * Strict weighted selector — roll ∈ [0, 100), cumulative tier weights, no flat indexing.
 */
export function selectWeightedStoreItemWithRoll<T extends { probability: number }>(
  items: readonly T[],
): WeightedRollResult<T> | undefined {
  if (items.length === 0) return undefined;
  if (items.length === 1) {
    return { item: items[0], rolledNumber: 0 };
  }

  const weights = normalizePackWeights(items);
  const roll = secureRandomUnit() * PROBABILITY_TOTAL;
  let cumulative = 0;

  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i]!;
    if (roll <= cumulative) return { item: items[i], rolledNumber: roll };
  }

  return { item: items[items.length - 1]!, rolledNumber: roll };
}

export function selectWeightedStoreItem<T extends { probability: number }>(
  items: readonly T[],
): T | undefined {
  return selectWeightedStoreItemWithRoll(items)?.item;
}

export interface PackRollResult {
  card: Card;
  rolledNumber: number;
}

/** Isolated card snapshot — no shared object refs across carousel slots. */
export function snapshotCard(card: Card): Card {
  return {
    id: card.id,
    name: card.name,
    rarity: card.rarity,
    value: card.value,
    image: card.image,
  };
}

export interface PackPullEntry {
  itemId: string;
  rolledNumber: number;
  /** Authoritative fields from open_pack — preferred for carousel/reveal when set. */
  serverItemName?: string;
  serverImageUrl?: string;
  serverGemValue?: number;
  serverStoreRarity?: string;
}

function findStoreItemInStaticCatalog(packId: string, itemId: string): StoreItem | undefined {
  const pack = findStaticPackById(packId);
  if (pack) {
    const fromStaticPack = getPackStoreItems(pack).find((item) => item.id === itemId);
    if (fromStaticPack) return fromStaticPack;
  }

  return POKEMON_ITEMS.find((item) => item.id === itemId);
}

function unknownCardFallback(itemId: string): Card {
  return {
    id: itemId,
    name: "Unknown Card",
    rarity: "Common",
    value: 0,
    image: "",
  };
}

/** Bind pull display to one catalog row — image, name, and id always match itemId. */
export function cardFromPullEntry(packId: string, entry: PackPullEntry): Card {
  const catalog = resolveCardByItemId(packId, entry.itemId);
  const serverValue = entry.serverGemValue;
  const value =
    serverValue != null && Number.isFinite(serverValue) && serverValue > 0
      ? serverValue
      : catalog.value;

  return snapshotCard({
    id: catalog.id,
    name: catalog.name,
    rarity: catalog.rarity,
    value,
    image: catalog.image,
  });
}

/**
 * Single source of truth — name, image, and gem value from the same catalog row as itemId.
 * Uses the same roll pool as RNG, then falls back to static pokemon pools if DB is partial.
 */
export function resolveCardByItemId(packId: string, itemId: string): Card {
  const normalizedId = itemId.trim();
  const rollPool = getPackRollPool(packId);
  const fromRollPool = rollPool.find((item) => item.id === normalizedId);

  if (fromRollPool) {
    return snapshotCard(storeItemToCard(fromRollPool));
  }

  logger.warn("[resolveCardByItemId] item missing from roll pool — trying static catalog", {
    packId,
    itemId: normalizedId,
    rollPoolItemIds: rollPool.map((item) => item.id),
  });

  const staticItem = findStoreItemInStaticCatalog(packId, normalizedId);
  if (staticItem) {
    logger.warn("[resolveCardByItemId] resolved from static packPokemonPools fallback", {
      packId,
      itemId: normalizedId,
      name: staticItem.name,
    });
    return snapshotCard(storeItemToCard(staticItem));
  }

  logger.error("[resolveCardByItemId] item missing from DB and static catalogs", {
    packId,
    itemId: normalizedId,
  });

  return unknownCardFallback(normalizedId);
}

/**
 * Bind roll output to a single catalog row so name, image, and value cannot drift.
 * Preserves authoritative name/image/value already on the winner card (e.g. server open_pack).
 */
export function resolveWinnerItem(packId: string, rolled: Card): Card {
  const catalog = resolveCardByItemId(packId, rolled.id);
  return snapshotCard({
    id: rolled.id,
    name: rolled.name.trim() || catalog.name,
    rarity: catalog.rarity,
    value: rolled.value > 0 ? rolled.value : catalog.value,
    image: rolled.image.trim() || catalog.image,
  });
}

export function rollCardForPackWithRoll(
  packId: string,
  options?: { riskyRip?: boolean },
): PackRollResult {
  let items = getPackRollPool(packId);
  if (options?.riskyRip) {
    items = applyRiskyRipMultipliers(items);
  }
  const pack = findPackById(packId);

  if (items.length === 0) {
    const card = rollCardFromCategoryPool(pack?.category ?? "pokemon");
    return { card, rolledNumber: secureRandomUnit() * PROBABILITY_TOTAL };
  }

  const roll = selectWeightedStoreItemWithRoll(items);
  if (!roll) {
    const card = rollCardFromCategoryPool(pack?.category ?? "pokemon");
    return { card, rolledNumber: secureRandomUnit() * PROBABILITY_TOTAL };
  }

  return {
    card: resolveCardByItemId(packId, roll.item.id),
    rolledNumber: roll.rolledNumber,
  };
}

export function rollCardForPack(packId: string): Card {
  return rollCardForPackWithRoll(packId).card;
}

/** Guest demo — always return the highest gem-value card in the pack roll pool. */
export function rollTopValueCardForPack(packId: string): PackRollResult {
  const items = getPackRollPool(packId);
  if (items.length === 0) {
    return rollCardForPackWithRoll(packId);
  }

  const topItem = items.reduce(
    (best, item) => (item.value > best.value ? item : best),
    items[0]!,
  );

  return {
    card: resolveCardByItemId(packId, topItem.id),
    rolledNumber: 0,
  };
}

function rollCardFromCategoryPool(category: PackCategory): Card {
  const pool = cardPoolForCategory(category);
  if (pool.length === 0) {
    return {
      id: "fallback",
      name: "Mystery Relic",
      rarity: "Common",
      value: 30,
      image: "",
    };
  }
  return pool[secureRandomIndex(pool.length)];
}

/** @deprecated prefer rollCardForPack when a pack is selected */
export function rollCard(): Card {
  return rollCardFromCategoryPool("pokemon");
}

export function rollMultipleWithRoll(
  count: number,
  packId?: string,
  options?: { riskyRip?: boolean },
): PackRollResult[] {
  return Array.from({ length: count }, () =>
    packId
      ? rollCardForPackWithRoll(packId, options)
      : { card: rollCard(), rolledNumber: secureRandomUnit() * PROBABILITY_TOTAL },
  );
}

export function rollMultiple(count: number, packId?: string): Card[] {
  return rollMultipleWithRoll(count, packId).map((result) => result.card);
}

/** 80-card roulette tape — winner anchored at index 65 */
export const ROULETTE_TAPE_LENGTH = 80;
export const ROULETTE_WINNER_INDEX = 65;

export const ROULETTE_CARD_WIDTH = 128;
export const ROULETTE_CARD_GAP = 12;
export const ROULETTE_SLOT_WIDTH = ROULETTE_CARD_WIDTH + ROULETTE_CARD_GAP;

export const ROULETTE_SPIN_MS = 4000;

/** @deprecated use ROULETTE_TAPE_LENGTH */
export const CAROUSEL_STRIP_LENGTH = ROULETTE_TAPE_LENGTH;
/** @deprecated use ROULETTE_WINNER_INDEX */
export const CAROUSEL_WINNER_INDEX = ROULETTE_WINNER_INDEX;

/**
 * Pixel offset so `winnerIndex` card center aligns with viewport center indicator.
 */
export function computeRouletteStopOffset(
  winnerIndex: number,
  containerWidth: number,
  slotWidth: number = ROULETTE_SLOT_WIDTH,
): number {
  if (containerWidth <= 0) return winnerIndex * slotWidth;
  const cardCenter = winnerIndex * slotWidth + slotWidth / 2;
  const viewportCenter = containerWidth / 2;
  return Math.max(0, cardCenter - viewportCenter);
}

export interface CarouselStripResult {
  strip: Card[];
  /** Same object reference placed at `winnerIndex` — use for reveal modal. */
  winnerItem: Card;
}

function pickWeightedCarouselFiller(packItems: StoreItem[]): Card {
  const item = selectWeightedStoreItem(packItems);
  if (item) return snapshotCard(storeItemToCard(item));
  return snapshotCard(storeItemToCard(packItems[0]));
}

/**
 * Build roulette tape: fillers from live pack catalog + unified winner at center index.
 */
export function buildCarouselStrip(
  winner: Card,
  packId: string,
  length: number = ROULETTE_TAPE_LENGTH,
  winnerIndex: number = ROULETTE_WINNER_INDEX,
): CarouselStripResult {
  const packItems = getPackRollPool(packId);
  const pack = findPackById(packId);
  const categoryFallback = cardPoolForCategory(pack?.category ?? "pokemon");

  const winnerItem = resolveWinnerItem(packId, winner);
  const strip: Card[] = new Array(length);

  for (let i = 0; i < length; i++) {
    if (i === winnerIndex) {
      strip[i] = winnerItem;
    } else if (packItems.length > 0) {
      strip[i] = pickWeightedCarouselFiller(packItems);
    } else {
      const filler = categoryFallback[secureRandomIndex(categoryFallback.length)];
      strip[i] = snapshotCard(filler);
    }
  }

  return { strip, winnerItem };
}

function hashSeedString(seed: string): number {
  let hash = 2_166_136_261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function createSeededRng(seed: string): () => number {
  let state = hashSeedString(seed) || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function shuffleDeterministic<T>(items: readonly T[], seed: string): T[] {
  const rng = createSeededRng(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

function buildDeterministicFillers(pool: Card[], count: number, seed: string): Card[] {
  if (count <= 0) return [];
  if (pool.length === 0) return [];

  const shuffled = shuffleDeterministic(pool, seed);
  if (shuffled.length >= count) {
    return shuffled.slice(0, count);
  }

  const result: Card[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(shuffled[i % shuffled.length]!);
  }
  return result;
}

/**
 * Mobile roulette tape — full drop table pool (deterministic order) + winner at center index.
 */
export function buildFullDropTableStrip(
  winner: Card,
  packId: string,
  length: number = ROULETTE_TAPE_LENGTH,
  winnerIndex: number = ROULETTE_WINNER_INDEX,
): CarouselStripResult {
  const winnerItem = resolveWinnerItem(packId, winner);
  const dropTable = getPackDropTable(packId);
  const seen = new Set<string>();
  const pool: Card[] = [];

  for (const entry of dropTable) {
    const card = resolveCardByItemId(packId, entry.card.id);
    if (card.id === winnerItem.id || seen.has(card.id)) continue;
    seen.add(card.id);
    pool.push(card);
  }

  const fillersNeeded = Math.max(0, length - 1);
  const fillers = buildDeterministicFillers(
    pool,
    fillersNeeded,
    `${packId}:${winnerItem.id}`,
  );

  const strip: Card[] = new Array(length);
  let fillerIndex = 0;
  for (let i = 0; i < length; i += 1) {
    if (i === winnerIndex) {
      strip[i] = winnerItem;
    } else {
      strip[i] =
        fillers[fillerIndex] ??
        winnerItem;
      fillerIndex += 1;
    }
  }

  return { strip, winnerItem };
}

/** Idle pack-room tape — showcases pack pool art before the user unlocks. */
export function buildPreviewCarouselStrip(
  packId: string,
  length: number = ROULETTE_TAPE_LENGTH,
  winnerIndex: number = ROULETTE_WINNER_INDEX,
): Card[] {
  const items = getPackRollPool(packId);
  const pack = findPackById(packId);
  const featured =
    items.length > 0
      ? resolveCardByItemId(packId, (selectWeightedStoreItem(items) ?? items[0]).id)
      : rollCardFromCategoryPool(pack?.category ?? "pokemon");

  return buildCarouselStrip(featured, packId, length, winnerIndex).strip;
}
