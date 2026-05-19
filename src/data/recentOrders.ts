import { storeItemToCard } from "../constants/catalog";
import type { LobbyCategoryFilter } from "../types";
import { VISIBLE_BET_USERS } from "./userProfiles";
import {
  pickPokemonPackWithItems,
  pickRandomPokemonStoreItem,
} from "./liveFeed";

export interface RecentOrder {
  id: string;
  collector: string;
  isHidden: boolean;
  boxOpened: string;
  itemUnboxed: string;
  marketValueGems: number;
  time: string;
}

const HIDDEN_RATIO = 0.4;

/** Hard cap for lobby feed state — matches visible DOM row limit. */
export const RECENT_ORDER_VISIBLE_COUNT = 5;
const MAX_ORDERS = RECENT_ORDER_VISIBLE_COUNT;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveCollector(): { collector: string; isHidden: boolean } {
  if (Math.random() < HIDDEN_RATIO) {
    return { collector: "Hidden Collector", isHidden: true };
  }
  return { collector: pick(VISIBLE_BET_USERS), isHidden: false };
}

/** @param _filter Reserved — live feed is Pokémon-only at launch. */
export function createRecentOrder(_filter: LobbyCategoryFilter = "all"): RecentOrder {
  const { pack, pool } = pickPokemonPackWithItems();
  const storeItem = pickRandomPokemonStoreItem(pool);
  const card = storeItemToCard(storeItem);
  const { collector, isHidden } = resolveCollector();

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    collector,
    isHidden,
    boxOpened: pack.name,
    itemUnboxed: card.name,
    marketValueGems: Math.max(1, card.value),
    time: "Just now",
  };
}

export function seedRecentOrders(
  count = RECENT_ORDER_VISIBLE_COUNT,
  filter: LobbyCategoryFilter = "all",
): RecentOrder[] {
  return Array.from({ length: count }, (_, i) => ({
    ...createRecentOrder(filter),
    time: i === 0 ? "Just now" : `${(i + 1) * 3}s ago`,
  }));
}

export function ageRecentOrders(orders: RecentOrder[]): RecentOrder[] {
  return orders.map((order) => ({
    ...order,
    time:
      order.time === "Just now"
        ? "3s ago"
        : order.time.endsWith("s ago")
          ? `${parseInt(order.time, 10) + 3}s ago`
          : order.time,
  }));
}

export function prependRecentOrder(
  orders: RecentOrder[],
  order: RecentOrder,
): RecentOrder[] {
  return [order, ...ageRecentOrders(orders)].slice(0, MAX_ORDERS);
}

export const RECENT_ORDER_INTERVAL_MS = 2500;
