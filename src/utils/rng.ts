import type { Card, PackCategory } from "../types";
import { LOBBY_PACK_CATALOG } from "../constants/packs";
import {
  cardPoolForCategory,
  getPackStoreItems,
  storeItemToCard,
} from "../constants/catalog";

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

/**
 * Bind roll output to a single catalog row so name, image, and value cannot drift.
 */
export function resolveWinnerItem(packId: string, rolled: Card): Card {
  const pack = LOBBY_PACK_CATALOG.find((p) => p.id === packId);
  if (!pack) return snapshotCard(rolled);

  const storeItem = getPackStoreItems(pack).find((item) => item.id === rolled.id);
  if (storeItem) return storeItemToCard(storeItem);

  return snapshotCard(rolled);
}

export function rollCardForPack(packId: string): Card {
  const pack = LOBBY_PACK_CATALOG.find((p) => p.id === packId);
  if (!pack) return rollCardFromCategoryPool("pokemon");

  const items = getPackStoreItems(pack);
  if (items.length === 0) return rollCardFromCategoryPool(pack.category);

  const total = items.reduce((sum, item) => sum + item.probability, 0);
  const roll = Math.random() * (total > 0 ? total : 100);
  let cumulative = 0;

  for (const item of items) {
    cumulative += item.probability;
    if (roll <= cumulative) return resolveWinnerItem(packId, storeItemToCard(item));
  }

  return resolveWinnerItem(packId, storeItemToCard(items[items.length - 1]));
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
  return pool[Math.floor(Math.random() * pool.length)];
}

/** @deprecated prefer rollCardForPack when a pack is selected */
export function rollCard(): Card {
  return rollCardFromCategoryPool("pokemon");
}

export function rollMultiple(count: number, packId?: string): Card[] {
  return Array.from({ length: count }, () =>
    packId ? rollCardForPack(packId) : rollCard(),
  );
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

/**
 * Build roulette tape: fillers from live pack catalog + unified winner at center index.
 */
export function buildCarouselStrip(
  winner: Card,
  packId: string,
  length: number = ROULETTE_TAPE_LENGTH,
  winnerIndex: number = ROULETTE_WINNER_INDEX,
): CarouselStripResult {
  const pack = LOBBY_PACK_CATALOG.find((p) => p.id === packId);
  const packItems = pack ? getPackStoreItems(pack) : [];
  const fillers =
    packItems.length > 0
      ? packItems.map((item) => storeItemToCard(item))
      : cardPoolForCategory(pack?.category ?? "pokemon");

  const winnerItem = resolveWinnerItem(packId, winner);
  const strip: Card[] = new Array(length);

  for (let i = 0; i < length; i++) {
    if (i === winnerIndex) {
      strip[i] = winnerItem;
    } else {
      const filler = fillers[Math.floor(Math.random() * fillers.length)];
      strip[i] = snapshotCard(filler);
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
  const pack = LOBBY_PACK_CATALOG.find((p) => p.id === packId);
  const items = getPackStoreItems(pack ?? { id: packId, category: "pokemon", name: "", cost: 0, theme: "gold", description: "", image: "" });
  const featured =
    items.length > 0
      ? storeItemToCard([...items].sort((a, b) => b.value - a.value)[0])
      : rollCardFromCategoryPool(pack?.category ?? "pokemon");

  return buildCarouselStrip(featured, packId, length, winnerIndex).strip;
}
