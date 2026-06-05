import type { Card, Rarity, VaultedCard, VaultItemStatus } from "../types";
import { canShipCardValue } from "../constants/retail";
import { findCatalogItemImageUrl, findCatalogItemStoreRarity, getPackRollPool } from "../data/boxCatalog";
import { normalizePackId } from "../constants/packIdAliases";
import { logger } from "./logger";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { VaultItemRow } from "../types/database";

const VALID_RARITIES: Rarity[] = ["Common", "Rare", "Ancient Rare"];

function normalizeRarity(value: string): Rarity {
  return VALID_RARITIES.includes(value as Rarity) ? (value as Rarity) : "Rare";
}

const KNOWN_VAULT_STATUSES: VaultItemStatus[] = [
  "vaulted",
  "pending_shipment",
  "shipped",
  "delivered",
  "exchanged",
  "upgraded_lost",
];

function normalizeVaultStatus(value: string | undefined | null): VaultItemStatus {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return "vaulted";
  }
  if (KNOWN_VAULT_STATUSES.includes(raw as VaultItemStatus)) {
    return raw as VaultItemStatus;
  }
  // Never coerce unknown DB statuses to "vaulted" — keeps locker filters accurate.
  return raw as VaultItemStatus;
}

function rowToVaultedCard(row: VaultItemRow): VaultedCard {
  return {
    vaultId: row.id,
    id: row.item_id,
    name: row.item_name,
    rarity: normalizeRarity(row.rarity),
    value: row.gem_value,
    image: row.image_url,
    acquiredAt: row.created_at,
    status: normalizeVaultStatus(row.status),
    shippingName: row.shipping_name ?? undefined,
    shippingAddress: row.shipping_address ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
  };
}

export function cardToVaultedCard(card: Card): VaultedCard {
  return {
    vaultId: `vault-${Date.now()}-${card.id}`,
    id: card.id,
    name: card.name,
    rarity: card.rarity,
    value: card.value,
    image: card.image,
    acquiredAt: new Date().toISOString(),
  };
}

/**
 * Direct client inserts into vault_items are blocked — pack pulls must use the
 * server-side `open_pack` RPC which sets gem_value authoritatively.
 */
export async function insertVaultItem(
  _userId: string,
  _card: VaultedCard,
): Promise<VaultedCard | null> {
  logger.warn("[vault_items] direct insert blocked — use open_pack RPC for pack pulls");
  return null;
}

/** Locker grid — only rows with status `vaulted` (excludes shipping / fulfillment). */
export async function fetchVaultLockerItems(userId: string, limit = 120): Promise<VaultedCard[]> {
  if (!isSupabaseConfigured() || !supabase || !userId.trim()) return [];

  const { data, error } = await supabase
    .from("vault_items")
    .select(
      "id, user_id, item_id, item_name, rarity, gem_value, image_url, created_at, status, shipping_name, shipping_address, tracking_number",
    )
    .eq("user_id", userId.trim())
    .eq("status", "vaulted")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn("[vault_items] locker fetch failed:", error.message);
    return [];
  }

  if (!Array.isArray(data)) return [];
  return data.map((row) => rowToVaultedCard(row as VaultItemRow));
}

/** Load vaulted collectibles from Supabase (newest first). */
export async function fetchVaultItems(userId: string, limit = 120): Promise<VaultedCard[]> {
  if (!isSupabaseConfigured() || !supabase || !userId.trim()) return [];

  const { data, error } = await supabase
    .from("vault_items")
    .select(
      "id, user_id, item_id, item_name, rarity, gem_value, image_url, created_at, status, shipping_name, shipping_address, tracking_number",
    )
    .eq("user_id", userId.trim())
    .neq("status", "exchanged")
    .neq("status", "upgraded_lost")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn("[vault_items] fetch failed:", error.message);
    return [];
  }

  if (!Array.isArray(data)) return [];
  return data.map((row) => rowToVaultedCard(row as VaultItemRow));
}

/** Remove one vault row by primary key. */
export async function deleteVaultItem(userId: string, vaultId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !userId.trim() || !vaultId.trim()) {
    return false;
  }

  const { error } = await supabase
    .from("vault_items")
    .delete()
    .eq("user_id", userId.trim())
    .eq("id", vaultId.trim());

  if (error) {
    logger.warn("[vault_items] delete failed:", error.message);
  }

  return !error;
}

export interface HallOfFamePull {
  vaultId: string;
  id: string;
  name: string;
  rarity: Rarity;
  storeRarity: string;
  value: number;
  image: string;
  acquiredAt: string;
  username: string;
}

interface HallOfFamePullRow {
  id: string;
  item_id: string;
  item_name: string;
  rarity: string;
  gem_value: number;
  image_url: string;
  created_at: string;
  username: string;
}

/** All-time top vaulted pulls for the Wins Hall of Fame. */
export async function fetchHallOfFamePulls(limit = 20): Promise<HallOfFamePull[]> {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await supabase.rpc("get_hall_of_fame_pulls", {
    p_limit: limit,
  } as never);

  if (error) {
    logger.warn("[hall_of_fame_pulls] fetch failed:", error.message);
    return [];
  }

  if (!Array.isArray(data)) return [];

  return (data as HallOfFamePullRow[]).map((row) => {
    const imageFromVault = row.image_url?.trim() ?? "";
    const image = imageFromVault || findCatalogItemImageUrl(row.item_id);
    return {
      vaultId: row.id,
      id: row.item_id,
      name: row.item_name,
      rarity: normalizeRarity(row.rarity),
      storeRarity: findCatalogItemStoreRarity(row.item_id),
      value: row.gem_value,
      image,
      acquiredAt: row.created_at,
      username: row.username?.trim() || "collector",
    };
  });
}

/** Sum of gem_value for pulls in the weekly Wins window. */
export async function fetchUserWeeklyPullGems(
  userId: string,
  weekStartIso: string,
  weekEndIso: string,
): Promise<number> {
  if (!isSupabaseConfigured() || !supabase || !userId.trim()) return 0;

  const { data, error } = await supabase
    .from("vault_items")
    .select("gem_value")
    .eq("user_id", userId.trim())
    .gte("created_at", weekStartIso)
    .lt("created_at", weekEndIso);

  if (error) {
    logger.warn("[vault_items] weekly pull sum failed:", error.message);
    return 0;
  }

  if (!Array.isArray(data)) return 0;
  return (data as { gem_value: number }[]).reduce(
    (sum, row) => sum + (Number(row.gem_value) || 0),
    0,
  );
}

export interface WeeklyBestPull {
  image: string;
  name: string;
  value: number;
}

/** Highest-value pull in the weekly Wins window for leaderboard thumbnail. */
export async function fetchUserWeeklyBestPull(
  userId: string,
  weekStartIso: string,
  weekEndIso: string,
): Promise<WeeklyBestPull | null> {
  if (!isSupabaseConfigured() || !supabase || !userId.trim()) return null;

  const { data, error } = await supabase
    .from("vault_items")
    .select("item_id, item_name, gem_value, image_url")
    .eq("user_id", userId.trim())
    .gte("created_at", weekStartIso)
    .lt("created_at", weekEndIso)
    .order("gem_value", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.warn("[vault_items] weekly best pull failed:", error.message);
    return null;
  }

  if (!data) return null;

  const row = data as {
    item_id: string;
    item_name: string;
    gem_value: number;
    image_url: string | null;
  };

  const imageFromVault = row.image_url?.trim() ?? "";
  const image = imageFromVault || findCatalogItemImageUrl(row.item_id);

  return {
    image,
    name: row.item_name,
    value: row.gem_value,
  };
}

interface RecentPullRow {
  id: string;
  item_id: string;
  item_name: string;
  rarity: string;
  gem_value: number;
  image_url: string;
  created_at: string;
}

function mapRecentPullRow(row: RecentPullRow): VaultedCard {
  const imageFromVault = row.image_url?.trim() ?? "";
  const image = imageFromVault || findCatalogItemImageUrl(row.item_id);
  return {
    vaultId: row.id,
    id: row.item_id,
    name: row.item_name,
    rarity: normalizeRarity(row.rarity),
    value: row.gem_value,
    image,
    acquiredAt: row.created_at,
    status: "vaulted" as const,
  };
}

/** Returns null when the RPC is missing; [] when the RPC succeeded with no rows. */
async function fetchRecentPullRowsFromRpc(
  rpcName: "get_recent_lobby_pulls" | "get_recent_pack_pulls",
  args: Record<string, unknown>,
): Promise<VaultedCard[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const { data, error } = await supabase.rpc(rpcName, args as never);

  if (error) {
    if (error.code === "PGRST202") {
      logger.warn(`[${rpcName}] RPC not deployed — apply supabase/recent_pack_pulls.sql`);
      return null;
    }
    logger.warn(`[${rpcName}] fetch failed:`, error.message);
    return null;
  }

  if (!Array.isArray(data)) return [];

  return (data as RecentPullRow[])
    .map(mapRecentPullRow)
    .filter((card) => card.vaultId);
}

/** Global recent pulls for the lobby live feed (>= $50, no user PII). */
export async function fetchRecentLobbyPulls(limit = 20): Promise<VaultedCard[]> {
  const rows = await fetchRecentPullRowsFromRpc("get_recent_lobby_pulls", { p_limit: limit });
  if (!rows) return [];

  return rows.filter((card) => canShipCardValue(card.value));
}

async function fetchRecentPackPullsFallback(
  packId: string,
  limit: number,
): Promise<VaultedCard[]> {
  const poolIds = new Set(getPackRollPool(packId).map((item) => item.id));
  if (poolIds.size === 0) return [];

  const lobbyRows = await fetchRecentPullRowsFromRpc("get_recent_lobby_pulls", {
    p_limit: Math.max(limit * 4, 40),
  });
  if (!lobbyRows) return [];

  return lobbyRows.filter((card) => poolIds.has(card.id)).slice(0, limit);
}

/** Recent pulls for one pack's roll pool (no user PII, all gem values). */
export async function fetchRecentPackPulls(
  packId: string,
  limit = 8,
): Promise<VaultedCard[]> {
  const trimmed = packId.trim();
  if (!trimmed) return [];

  const normalized = normalizePackId(trimmed);
  const rpcRows = await fetchRecentPullRowsFromRpc("get_recent_pack_pulls", {
    p_pack_id: normalized,
    p_limit: limit,
  });

  if (rpcRows !== null) return rpcRows;

  return fetchRecentPackPullsFallback(normalized, limit);
}
