import { gemsToUsd } from "../constants/retail";
import { logger } from "./logger";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export interface BattleRecord {
  wins: number;
  losses: number;
}

export type BattleOutcome = "win" | "loss" | "tie";

/** Strict comparison — equal gem values are a tie, not a win. */
export function resolveBattleOutcome(userGems: number, botGems: number): BattleOutcome {
  if (userGems > botGems) return "win";
  if (userGems < botGems) return "loss";
  return "tie";
}

export interface TopBattlerRow {
  userId: string;
  username: string;
  wins: number;
  losses: number;
  winRate: number;
}

export type BattleRpcResult =
  | { ok: true; bonusGems?: number; gemsBalance?: number; withdrawableBalance?: number }
  | { ok: false; error: string };

function parseBattleRecordRow(data: unknown): BattleRecord | null {
  if (data == null || typeof data !== "object") return null;
  const row = data as { wins?: unknown; losses?: unknown };
  const wins = Number(row.wins);
  const losses = Number(row.losses);
  if (!Number.isFinite(wins) || !Number.isFinite(losses)) return null;
  return { wins: Math.max(0, Math.round(wins)), losses: Math.max(0, Math.round(losses)) };
}

export async function fetchBattleRecord(userId: string): Promise<BattleRecord> {
  if (!userId.trim() || !isSupabaseConfigured() || !supabase) {
    return { wins: 0, losses: 0 };
  }

  const { data, error } = await supabase
    .from("battle_record")
    .select("wins, losses")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.warn("[packBattle] fetchBattleRecord:", error.message);
    return { wins: 0, losses: 0 };
  }

  return parseBattleRecordRow(data) ?? { wins: 0, losses: 0 };
}

/** Win bonus as a fraction of pack list price (USD). */
export const BATTLE_WIN_BONUS_RATE = 0.02;

export function battleWinBonusCents(packCostGems: number): number {
  const usd = gemsToUsd(packCostGems);
  return Math.max(0, Math.round(usd * BATTLE_WIN_BONUS_RATE * 100));
}

export async function awardBattleBonus(
  userId: string,
  packCostGems: number,
): Promise<BattleRpcResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: "Battles require Supabase configuration." };
  }

  const amountCents = battleWinBonusCents(packCostGems);

  const { data, error } = await supabase.rpc("award_battle_bonus", {
    p_user_id: userId,
    p_amount_cents: amountCents,
  } as never);

  if (error) {
    logger.warn("[packBattle] award_battle_bonus:", error.message);
    return { ok: false, error: "Could not award battle bonus." };
  }

  const payload = data as {
    success?: boolean;
    error?: string;
    bonus_gems?: number;
    gems_balance?: number;
    withdrawable_balance?: number;
  };

  if (payload?.success !== true) {
    return { ok: false, error: payload?.error ?? "Could not award battle bonus." };
  }

  return {
    ok: true,
    bonusGems: Number(payload.bonus_gems) || amountCents,
    gemsBalance: Number(payload.gems_balance),
    withdrawableBalance: Number(payload.withdrawable_balance),
  };
}

export async function recordBattleLoss(userId: string): Promise<BattleRpcResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: "Battles require Supabase configuration." };
  }

  const { data, error } = await supabase.rpc("record_battle_loss", {
    p_user_id: userId,
  } as never);

  if (error) {
    logger.warn("[packBattle] record_battle_loss:", error.message);
    return { ok: false, error: "Could not record battle loss." };
  }

  const payload = data as { success?: boolean; error?: string };
  if (payload?.success !== true) {
    return { ok: false, error: payload?.error ?? "Could not record battle loss." };
  }

  return { ok: true };
}

export async function fetchTopBattlers(limit = 10): Promise<TopBattlerRow[]> {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await supabase.rpc("fetch_top_battlers", {
    p_limit: limit,
  } as never);

  if (error) {
    logger.warn("[packBattle] fetch_top_battlers:", error.message);
    return [];
  }

  if (!Array.isArray(data)) return [];

  const rows = data as Array<{
    user_id?: string;
    username?: string;
    wins?: number;
    losses?: number;
    win_rate?: number;
  }>;

  return rows
    .map((row) => {
      if (row == null || typeof row !== "object") return null;
      const userId = typeof row.user_id === "string" ? row.user_id : "";
      if (!userId) return null;
      return {
        userId,
        username: typeof row.username === "string" ? row.username : "Ripp3r",
        wins: Math.max(0, Number(row.wins) || 0),
        losses: Math.max(0, Number(row.losses) || 0),
        winRate: Number(row.win_rate) || 0,
      };
    })
    .filter((row): row is TopBattlerRow => row != null);
}
