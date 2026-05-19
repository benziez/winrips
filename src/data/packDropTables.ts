import type { Card, PackCategory } from "../types";
import { getCategoryPool, getPackStoreItems, storeItemToCard } from "../constants/catalog";
import type { StoreItem } from "../types/store";
import { LOBBY_PACK_CATALOG } from "../constants/packs";

export interface PackDropEntry {
  card: Card;
  storeRarity: StoreItem["rarity"];
  /** Display probability in percent, e.g. 0.2 for Ancient Rare */
  probability: number;
}

export interface PackBestDrop {
  id: string;
  username: string;
  card: Card;
  pulledAt: string;
}

function buildDropTableFromStoreItems(items: StoreItem[]): PackDropEntry[] {
  if (items.length === 0) return [];

  const rawTotal = items.reduce((sum, item) => sum + item.probability, 0);
  const scale = rawTotal > 0 ? 100 / rawTotal : 1;

  const entries = items.map((item) => ({
    card: storeItemToCard(item),
    storeRarity: item.rarity,
    probability: item.probability * scale,
  }));

  const sum = entries.reduce((acc, e) => acc + e.probability, 0);
  const drift = 100 - sum;
  if (Math.abs(drift) > 0.001 && entries.length > 0) {
    entries[0].probability += drift;
  }

  return entries;
}

function dropTableForPack(packId: string): PackDropEntry[] {
  const pack = LOBBY_PACK_CATALOG.find((p) => p.id === packId);
  if (!pack) return [];

  const items = getPackStoreItems(pack);
  return buildDropTableFromStoreItems(items);
}

/** Per-pack drop tables — probabilities sum to 100% per pack */
export const PACK_DROP_TABLES: Record<string, PackDropEntry[]> = Object.fromEntries(
  LOBBY_PACK_CATALOG.map((pack) => [pack.id, dropTableForPack(pack.id)]),
);

function topCardsForCategory(category: PackCategory, count: number): Card[] {
  return [...getCategoryPool(category)]
    .sort((a, b) => b.value - a.value)
    .slice(0, count)
    .map(storeItemToCard);
}

function topCardsForPack(packId: string, count: number): Card[] {
  const pack = LOBBY_PACK_CATALOG.find((p) => p.id === packId);
  if (!pack) return [];
  return [...getPackStoreItems(pack)]
    .sort((a, b) => b.value - a.value)
    .slice(0, count)
    .map(storeItemToCard);
}

export const PACK_BEST_DROPS: Record<string, PackBestDrop[]> = {
  "trainers-starter": topCardsForPack("trainers-starter", 4).map((card, i) => ({
    id: `bd-starter-${i + 1}`,
    username: ["RookieRip", "HoloHunter", "BudgetKing", "StarterMain"][i],
    card,
    pulledAt: `${(i + 1) * 4}m ago`,
  })),
  "151-booster-collector": topCardsForPack("151-booster-collector", 5).map((card, i) => ({
    id: `bd-151-${i + 1}`,
    username: ["SetMaster", "151Chaser", "UltraRare", "SVCollector", "BoxKing"][i],
    card,
    pulledAt: `${(i + 1) * 3}m ago`,
  })),
  "legendary-hunt": topCardsForPack("legendary-hunt", 5).map((card, i) => ({
    id: `bd-hunt-${i + 1}`,
    username: ["AltArtAce", "SecretPull", "HuntLord", "VarianceMax", "ChaseFiend"][i],
    card,
    pulledAt: i === 0 ? "just now" : `${i * 4}m ago`,
  })),
  "god-pack-1999": topCardsForPack("god-pack-1999", 5).map((card, i) => ({
    id: `bd-god-1999-${i + 1}`,
    username: ["GrailWhale", "GodPack99", "MythicApe", "CeilingHit", "RelicLord"][i],
    card,
    pulledAt: i === 0 ? "just now" : `${i * 5}m ago`,
  })),
  "all-star-hardwood": topCardsForCategory("nba", 4).map((card, i) => ({
    id: `bd-nba-${i + 1}`,
    username: ["CourtKing", "Hardwood", "SlamDunk", "TripleDouble"][i],
    card,
    pulledAt: `${(i + 1) * 4}m ago`,
  })),
  "octagon-legends": topCardsForCategory("ufc", 4).map((card, i) => ({
    id: `bd-ufc-${i + 1}`,
    username: ["OctagonAce", "GroundGame", "FightNight", "ChampBelt"][i],
    card,
    pulledAt: `${(i + 1) * 5}m ago`,
  })),
  "gridiron-legends": topCardsForCategory("nfl", 4).map((card, i) => ({
    id: `bd-nfl-${i + 1}`,
    username: ["SundayMax", "Gridiron", "Touchdown", "HailMary"][i],
    card,
    pulledAt: `${(i + 1) * 4}m ago`,
  })),
  "duelists-vault": topCardsForCategory("yugioh", 4).map((card, i) => ({
    id: `bd-ygo-${i + 1}`,
    username: ["DuelistKing", "TrapCard", "SpellWeaver", "ExodiaFan"][i],
    card,
    pulledAt: `${(i + 1) * 6}m ago`,
  })),
};

export function getPackDropTable(packId: string): PackDropEntry[] {
  return PACK_DROP_TABLES[packId] ?? [];
}

export function getPackBestDrops(packId: string): PackBestDrop[] {
  if (PACK_BEST_DROPS[packId]) return PACK_BEST_DROPS[packId];
  const pack = LOBBY_PACK_CATALOG.find((p) => p.id === packId);
  if (pack) {
    return topCardsForCategory(pack.category, 4).map((card, i) => ({
      id: `bd-fallback-${packId}-${i}`,
      username: "Collector",
      card,
      pulledAt: `${(i + 1) * 3}m ago`,
    }));
  }
  return [];
}

export function formatProbability(p: number): string {
  if (p >= 1) return `${p.toFixed(p % 1 === 0 ? 0 : 1)}%`;
  if (p >= 0.1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(2)}%`;
}
