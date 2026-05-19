import type { AppView } from "../types";

const VIEW_PATHS: Partial<Record<AppView, string>> = {
  lobby: "/",
  vault: "/vault",
  upgrader: "/upgrader",
  battles: "/battles",
  inventory: "/vault",
  leaderboard: "/leaderboard",
  rewards: "/rewards",
  marketplace: "/marketplace",
  fairness: "/fairness",
  "help-desk": "/help-desk",
  "self-exclusion": "/self-exclusion",
};

const PATH_TO_VIEW: Record<string, AppView> = {
  "/": "lobby",
  "/vault": "vault",
  "/upgrader": "upgrader",
  "/battles": "battles",
};

export function pathForView(view: AppView): string {
  return VIEW_PATHS[view] ?? "/";
}

export function parseAppPath(pathname: string): AppView | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return PATH_TO_VIEW[normalized] ?? null;
}
