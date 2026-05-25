import { POKEMON_ITEMS } from "../constants/pokemonCatalog";
import { VISIBLE_BET_USERS } from "./userProfiles";

export interface GrailCard {
  name: string;
  gems: number;
}

export interface SimulatedWin {
  id: string;
  username: string;
  item: string;
  gems: number;
}

const MIN_WIN_GEMS = 1001;
const GRAIL_POOL_SIZE = 36;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function truncateUsername(seed: string): string {
  const first = seed.trim()[0]?.toLowerCase();
  return first ? `${first}***` : "x***";
}

/** High-value chase cards surfaced in the live feed. */
export const GRAIL_CARDS: GrailCard[] = (() => {
  const seen = new Set<string>();
  const pool: GrailCard[] = [];

  for (const item of [...POKEMON_ITEMS].sort((a, b) => b.value - a.value)) {
    if (item.value <= MIN_WIN_GEMS || seen.has(item.name)) continue;
    seen.add(item.name);
    pool.push({ name: item.name, gems: item.value });
    if (pool.length >= GRAIL_POOL_SIZE) break;
  }

  return pool;
})();

/** Masked usernames shown in the ticker (e.g. b***, m***). */
export const RECENT_WINNERS: readonly string[] = [
  ...VISIBLE_BET_USERS.map(truncateUsername),
  ..."abcdefghijklmnopqrstuvwxyz".split("").map((letter) => `${letter}***`),
];

export function createSimulatedWin(): SimulatedWin {
  const grail = pick(GRAIL_CARDS.length > 0 ? GRAIL_CARDS : [{ name: "Charizard Holo", gems: 50000 }]);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    username: pick(RECENT_WINNERS),
    item: grail.name,
    gems: grail.gems,
  };
}

export function seedSimulatedWins(count: number): SimulatedWin[] {
  return Array.from({ length: count }, () => createSimulatedWin());
}

export const SIMULATED_FEED_MAX_WINS = 10;
export const SIMULATED_FEED_INTERVAL_MIN_MS = 3000;
export const SIMULATED_FEED_INTERVAL_MAX_MS = 5000;
