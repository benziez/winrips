import type { Card, Rarity, VaultedCard, VaultItemStatus } from "../types";
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
