import { fetchAccountBalance } from "./paymentsApi";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { logger } from "./logger";

export interface UserBalances {
  gemBalance: number;
  withdrawableBalance: number;
  sweepsBalance: number;
  /** True when `gems_balance` was read from a profiles row (including explicit zero). */
  gemBalanceFromProfile: boolean;
}

/** Default gem balance only when `profiles.gems_balance` is null or absent. */
export const DEFAULT_ACCOUNT_GEM_BALANCE = 1_000_000;

/** After a profiles query error, skip PostgREST for this page session to avoid console/network spam. */
let skipProfilesBalance = false;

let loggedProfilesFallback = false;

function coerceNonNegative(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

/**
 * Maps `profiles.gems_balance` to a spendable gem total.
 * Returns `null` only when the column is null/undefined (caller applies default).
 */
export function parseProfileWithdrawableBalance(raw: unknown): number {
  if (raw === null || raw === undefined) {
    return 0;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.round(parsed);
}

export function parseProfileGemBalance(raw: unknown): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed);
}

/** Applies server gem value to React state — no legacy overrides. */
export function resolveSyncedGemBalance(
  serverGem: number,
  gemBalanceFromProfile = true,
): number {
  if (!gemBalanceFromProfile) {
    return coerceNonNegative(serverGem);
  }
  const parsed = Number(serverGem);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_ACCOUNT_GEM_BALANCE;
  }
  return Math.round(parsed);
}

/** Dev KV override is active only when the client dev secret is configured. */
export function isDevKvBalanceOverrideEnabled(): boolean {
  return import.meta.env.DEV && Boolean(import.meta.env.VITE_DEV_BALANCE_SECRET?.trim());
}

function shouldAttemptProfilesQuery(): boolean {
  return isSupabaseConfigured() && !skipProfilesBalance;
}

function logProfilesFallbackOnce(reason: string): void {
  if (loggedProfilesFallback) return;
  loggedProfilesFallback = true;
  if (import.meta.env.DEV) {
    logger.log(`[balances] Using /api/account/balance (${reason}).`);
  }
}

async function fetchBalancesFromProfiles(
  authUserId: string,
): Promise<UserBalances | null> {
  if (!shouldAttemptProfilesQuery() || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, gems_balance, withdrawable_balance, username")
    .eq("id", authUserId)
    .single();

  if (error) {
    if (!import.meta.env.DEV || isDevKvBalanceOverrideEnabled()) {
      skipProfilesBalance = true;
    }
    logProfilesFallbackOnce(error.message?.trim() || "profiles query failed");
    return null;
  }

  const profile = data as {
    gems_balance: number | null;
    withdrawable_balance?: number | null;
  } | null;
  const parsedGem = parseProfileGemBalance(profile?.gems_balance);
  const gemBalanceFromProfile = parsedGem !== null;
  const gemBalance = gemBalanceFromProfile ? parsedGem : DEFAULT_ACCOUNT_GEM_BALANCE;
  const withdrawableBalance = parseProfileWithdrawableBalance(profile?.withdrawable_balance);

  return {
    gemBalance,
    withdrawableBalance,
    gemBalanceFromProfile,
    sweepsBalance: 0,
  };
}

async function fetchBalancesFromApi(authUserId: string): Promise<UserBalances> {
  const remote = await fetchAccountBalance(authUserId);
  return {
    gemBalance: coerceNonNegative(remote.gemBalance),
    withdrawableBalance: 0,
    gemBalanceFromProfile: false,
    sweepsBalance: coerceNonNegative(remote.tokenBalance),
  };
}

/**
 * Loads balances for the authenticated Supabase user.
 * Prefers live `profiles.gems_balance` when Supabase is configured; falls back to API/KV.
 */
export async function fetchUserBalances(authUserId: string): Promise<UserBalances> {
  if (!authUserId.trim()) {
    return { gemBalance: 0, withdrawableBalance: 0, sweepsBalance: 0, gemBalanceFromProfile: false };
  }

  try {
    const fromProfiles = await fetchBalancesFromProfiles(authUserId);
    if (fromProfiles) {
      return fromProfiles;
    }
  } catch {
    skipProfilesBalance = true;
    logProfilesFallbackOnce("profiles query threw");
  }

  return fetchBalancesFromApi(authUserId);
}
