import { normalizePackId } from "./packIdAliases";
import type { Pack } from "../types";

/** Default daily open caps — mirrored in supabase/daily_pack_limits.sql. */
export const PACK_DAILY_LIMITS: Record<string, number> = {
  "trainers-starter": 500,
  "mega-evolution": 200,
  "shiny-vault": 200,
  "151-booster-collector": 200,
  "151-booster": 200,
  "legendary-hunt": 150,
  "waifu-vault": 150,
  "prismatic-sir": 100,
  "psa-10-chaser": 100,
  "evolving-skies": 100,
  "obsidian-vault": 50,
  "god-pack-1999": 50,
  "1999-god": 50,
  "wotc-first-edition": 25,
  "power-hour": 100,
  "midnight-grail": 75,
  flash: 150,
  "weekend-warrior": 100,
  "infinite-prime": 50,
  "infinite-apex": 50,
  "infinite-zenith": 25,
  "infinite-omega": 25,
};

export const WOTC_FIRST_EDITION_PACK_ID = "wotc-first-edition";

export function defaultDailyLimitForPack(packId: string): number | undefined {
  return PACK_DAILY_LIMITS[normalizePackId(packId)];
}

export function isWotcFirstEditionPackId(packId: string): boolean {
  return normalizePackId(packId) === WOTC_FIRST_EDITION_PACK_ID;
}

/** Bypass front-end daily-limit sold-out UI (global counter can be stale for WOTC). */
export function bypassesPackDailyLimitUi(packId: string): boolean {
  return isWotcFirstEditionPackId(packId);
}

/** Coerce catalog counters so stale strings/null never mark a pack sold out incorrectly. */
export function normalizedPackOpensToday(opensToday?: number | null): number {
  const value = Number(opensToday ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function normalizedPackDailyLimit(dailyLimit?: number | null): number | undefined {
  if (dailyLimit == null) return undefined;
  const value = Number(dailyLimit);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

export function packOpensRemaining(
  pack: Pick<Pack, "dailyLimit" | "opensToday">,
): number | null {
  const limit = normalizedPackDailyLimit(pack.dailyLimit);
  if (limit == null) return null;
  return Math.max(0, limit - normalizedPackOpensToday(pack.opensToday));
}

export function isPackSoldOutToday(_pack: Pick<Pack, "dailyLimit" | "opensToday">): boolean {
  return false;
}

export function enrichPackDailyLimit<T extends Pack>(pack: T): T {
  const dailyLimit = normalizedPackDailyLimit(
    pack.dailyLimit ?? defaultDailyLimitForPack(pack.id),
  );
  if (dailyLimit == null) return pack;
  return {
    ...pack,
    dailyLimit,
    opensToday: normalizedPackOpensToday(pack.opensToday),
  };
}
