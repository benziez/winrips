import type { Card } from "../types";
import { storeItemToCard } from "../constants/catalog";
import { VISIBLE_BET_USERS } from "./userProfiles";
import type { LobbyCategoryFilter } from "../types";
import {
  pickPokemonPackWithItems,
  pickRandomPokemonStoreItem,
} from "./liveFeed";

export interface PlatformDrop {
  id: string;
  username: string;
  isHidden: boolean;
  packName: string;
  item: Card;
  timestamp: string;
}

const HIDDEN_RATIO = 0.4;
const MAX_DROPS = 16;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveUser(): { username: string; isHidden: boolean } {
  if (Math.random() < HIDDEN_RATIO) {
    return { username: "Hidden", isHidden: true };
  }
  return { username: pick(VISIBLE_BET_USERS), isHidden: false };
}

/** @param _filter Reserved — live feed is Pokémon-only at launch. */
export function createPlatformDrop(_filter: LobbyCategoryFilter = "all"): PlatformDrop {
  const { pack, pool } = pickPokemonPackWithItems();
  const storeItem = pickRandomPokemonStoreItem(pool);
  const { username, isHidden } = resolveUser();

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    username,
    isHidden,
    packName: pack.name,
    item: storeItemToCard(storeItem),
    timestamp: "Just now",
  };
}

export function seedPlatformDrops(
  count = 10,
  filter: LobbyCategoryFilter = "all",
): PlatformDrop[] {
  return Array.from({ length: count }, (_, i) => ({
    ...createPlatformDrop(filter),
    timestamp: i === 0 ? "Just now" : `${(i + 1) * 4}s ago`,
  }));
}

export const LIVE_DROP_INTERVAL_MS = 5000;

export function ageDrops(drops: PlatformDrop[]): PlatformDrop[] {
  return drops.map((d) => ({
    ...d,
    timestamp:
      d.timestamp === "Just now"
        ? "4s ago"
        : d.timestamp.endsWith("s ago")
          ? `${parseInt(d.timestamp, 10) + 4}s ago`
          : d.timestamp,
  }));
}

export function prependDrop(drops: PlatformDrop[], drop: PlatformDrop): PlatformDrop[] {
  return [drop, ...ageDrops(drops)].slice(0, MAX_DROPS);
}
