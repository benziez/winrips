import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { logger } from "./logger";
import type { PlayHistoryInsert, PlayHistoryRow } from "../types/database";

export type { PlayHistoryRow };

export interface RecordPlayHistoryInput {
  userId: string;
  packName: string;
  spinCost: number;
  wonItemName: string;
  wonItemValue: number;
  wonItemImage: string;
  rolledNumber: number;
}

function normalizePlayHistoryRow(raw: Record<string, unknown>): PlayHistoryRow | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  const user_id = typeof raw.user_id === "string" ? raw.user_id : "";
  const pack_name = typeof raw.pack_name === "string" ? raw.pack_name : "";
  const won_item_name = typeof raw.won_item_name === "string" ? raw.won_item_name : "";
  const won_item_image = typeof raw.won_item_image === "string" ? raw.won_item_image : "";
  const spin_cost = Number(raw.spin_cost);
  const won_item_value = Number(raw.won_item_value);
  const rolled_number = Number(raw.rolled_number);
  const created_at =
    typeof raw.created_at === "string" && raw.created_at.trim()
      ? raw.created_at
      : new Date().toISOString();

  if (
    !id ||
    !user_id ||
    !pack_name ||
    !won_item_name ||
    !Number.isFinite(spin_cost) ||
    !Number.isFinite(won_item_value) ||
    !Number.isFinite(rolled_number)
  ) {
    return null;
  }

  return {
    id,
    user_id,
    pack_name,
    spin_cost: Math.round(spin_cost),
    won_item_name,
    won_item_value: Math.round(won_item_value),
    won_item_image,
    rolled_number,
    created_at,
  };
}

/** Persist a completed pack spin for the authenticated user. */
export async function recordPlayHistory(input: RecordPlayHistoryInput): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;

  const userId = input.userId.trim();
  if (!userId) return;

  const payload: PlayHistoryInsert = {
    user_id: userId,
    pack_name: input.packName.trim(),
    spin_cost: Math.max(0, Math.round(input.spinCost)),
    won_item_name: input.wonItemName.trim(),
    won_item_value: Math.max(0, Math.round(input.wonItemValue)),
    won_item_image: input.wonItemImage.trim(),
    rolled_number: Number(input.rolledNumber.toFixed(6)),
  };

  const { error } = await supabase
    .from("play_history")
    .insert(payload as never);

  if (error) {
    logger.warn("[play_history] insert failed:", error.message);
  }
}

/** Load recent spins for the user hub (newest first). */
export async function fetchPlayHistory(
  userId: string,
  limit = 50,
): Promise<PlayHistoryRow[]> {
  if (!isSupabaseConfigured() || !supabase || !userId.trim()) return [];

  const { data, error } = await supabase
    .from("play_history")
    .select(
      "id, user_id, pack_name, spin_cost, won_item_name, won_item_value, won_item_image, rolled_number, created_at",
    )
    .eq("user_id", userId.trim())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn("[play_history] fetch failed:", error.message);
    return [];
  }

  if (!Array.isArray(data)) return [];

  return data
    .map((row) => normalizePlayHistoryRow(row as Record<string, unknown>))
    .filter((row): row is PlayHistoryRow => row !== null);
}
