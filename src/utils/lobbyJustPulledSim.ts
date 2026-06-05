import type { Rarity } from "../types";
import type { StoreItem } from "../types/store";
import { gemsToUsd } from "../constants/retail";
import { getLobbyPackCatalog, getPackRollPool } from "../data/boxCatalog";
import { resolveStoreItemImage } from "./collectibleFallback";

export interface LobbySimTierPools {
  common: StoreItem[];
  mid: StoreItem[];
  high: StoreItem[];
  /** Last-resort pool when a tier band is empty in the catalog. */
  fallback: StoreItem[];
}

export interface LobbySimPullTile {
  key: string;
  itemId: string;
  name: string;
  value: number;
  image: string;
  rarity: Rarity;
  acquiredAt: string;
}

const COMMON_MIN_USD = 5;
const COMMON_MAX_USD = 30;
const MID_MIN_USD = 50;
const MID_MAX_USD = 150;
const HIGH_MIN_USD = 200;

/** Unique catalog cards grouped by lobby feed value tier ($5–30 / $50–150 / $200+). */
export function buildLobbySimTierPools(): LobbySimTierPools {
  const seen = new Set<string>();
  const common: StoreItem[] = [];
  const mid: StoreItem[] = [];
  const high: StoreItem[] = [];
  const fallback: StoreItem[] = [];

  for (const pack of getLobbyPackCatalog()) {
    for (const item of getPackRollPool(pack.id)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      fallback.push(item);

      const usd = gemsToUsd(item.value);
      if (usd >= COMMON_MIN_USD && usd <= COMMON_MAX_USD) {
        common.push(item);
      } else if (usd >= MID_MIN_USD && usd <= MID_MAX_USD) {
        mid.push(item);
      } else if (usd >= HIGH_MIN_USD) {
        high.push(item);
      }
    }
  }

  return { common, mid, high, fallback };
}

function pickFromPool(primary: StoreItem[], fallback: StoreItem[]): StoreItem {
  const pool = primary.length > 0 ? primary : fallback;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** 60% common ($5–30), 30% mid ($50–150), 10% high ($200+). */
export function pickWeightedLobbySimCard(pools: LobbySimTierPools): StoreItem {
  const { common, mid, high, fallback } = pools;
  const roll = Math.random();

  if (roll < 0.6) {
    return pickFromPool(common, mid.length > 0 ? mid : high.length > 0 ? high : fallback);
  }
  if (roll < 0.9) {
    return pickFromPool(mid, common.length > 0 ? common : high.length > 0 ? high : fallback);
  }
  return pickFromPool(high, mid.length > 0 ? mid : common.length > 0 ? common : fallback);
}

export function spawnLobbySimPullTile(
  pools: LobbySimTierPools,
  seq: number,
  ageSec: number,
): LobbySimPullTile {
  const item = pickWeightedLobbySimCard(pools);
  return {
    key: `lobby-sim-${seq}`,
    itemId: item.id,
    name: item.name,
    value: item.value,
    image: resolveStoreItemImage(item),
    rarity: item.appRarity,
    acquiredAt: new Date(Date.now() - ageSec * 1000).toISOString(),
  };
}
