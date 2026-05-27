import type { AppView } from "../types";

const VIEW_PATHS: Partial<Record<AppView, string>> = {
  lobby: "/",
  "pack-open": "/pack",
  vault: "/vault",
  "play-history": "/vault/history",
  upgrader: "/upgrader",
  battles: "/battles",
  "battle-arena": "/battles",
  inventory: "/vault",
  leaderboard: "/leaderboard",
  showroom: "/showroom",
  rewards: "/rewards",
  marketplace: "/marketplace",
  fairness: "/fairness",
  "help-desk": "/help-desk",
  "self-exclusion": "/self-exclusion",
  admin: "/admin",
};

const PATH_TO_VIEW: Record<string, AppView> = {
  "/": "lobby",
  "/pack": "pack-open",
  "/vault": "vault",
  "/vault/history": "play-history",
  "/play-history": "play-history",
  "/upgrader": "upgrader",
  "/battles": "battles",
  "/leaderboard": "leaderboard",
  "/showroom": "showroom",
  "/rewards": "rewards",
  "/marketplace": "marketplace",
  "/fairness": "fairness",
  "/admin": "admin",
};

const BATTLE_PATH_PREFIX = "/battles/";

export function parseBattleIdFromPath(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (!normalized.startsWith(BATTLE_PATH_PREFIX)) return null;

  const battleId = normalized.slice(BATTLE_PATH_PREFIX.length).trim();
  if (!battleId) return null;

  return battleId;
}

export function battlePathForId(battleId: string): string {
  return `${BATTLE_PATH_PREFIX}${battleId}`;
}

export function pathForView(view: AppView, battleId?: string | null): string {
  if (view === "battle-arena" && battleId) {
    return battlePathForId(battleId);
  }
  return VIEW_PATHS[view] ?? "/";
}

export function parseAppPath(pathname: string): AppView | null {
  if (parseBattleIdFromPath(pathname)) return "battle-arena";

  const normalized = pathname.replace(/\/+$/, "") || "/";
  return PATH_TO_VIEW[normalized] ?? null;
}
