import type { Rarity, VaultedCard } from "../types";
import { deleteVaultItem, fetchVaultItems, insertVaultItem } from "./vaultItems";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export interface VaultInventoryResponse {
  userId: string;
  items: VaultedCard[];
}

const RARITIES: Rarity[] = ["Common", "Rare", "Ancient Rare"];

function normalizeRarity(value: string): Rarity {
  return RARITIES.includes(value as Rarity) ? (value as Rarity) : "Rare";
}

function normalizeVaultCard(raw: Record<string, unknown>): VaultedCard | null {
  const vaultId = typeof raw.vaultId === "string" ? raw.vaultId.trim() : "";
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const image = typeof raw.image === "string" ? raw.image.trim() : "";
  const value = Number(raw.value);
  const rarity = normalizeRarity(typeof raw.rarity === "string" ? raw.rarity : "Rare");
  const acquiredAt =
    typeof raw.acquiredAt === "string" && raw.acquiredAt.trim()
      ? raw.acquiredAt.trim()
      : new Date().toISOString();

  if (!vaultId || !id || !name || !image || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return {
    vaultId,
    id,
    name,
    rarity,
    value: Math.round(value),
    image,
    acquiredAt,
  };
}

async function fetchVaultInventoryFromApi(authUserId: string): Promise<VaultedCard[]> {
  const params = new URLSearchParams({ userId: authUserId });
  const response = await fetch(`/api/vault/inventory?${params.toString()}`);

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const snippet = (await response.text()).slice(0, 120);
    throw new Error(
      `Vault API returned non-JSON (${response.status}). ${snippet}`,
    );
  }

  const data = (await response.json()) as VaultInventoryResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to load vault inventory.");
  }

  if (!Array.isArray(data.items)) return [];

  return data.items
    .map((item) => normalizeVaultCard(item as unknown as Record<string, unknown>))
    .filter((item): item is VaultedCard => item !== null);
}

export async function fetchUserVaultInventory(authUserId: string): Promise<VaultedCard[]> {
  if (!authUserId.trim()) return [];

  if (isSupabaseConfigured()) {
    const items = await fetchVaultItems(authUserId);
    if (items.length > 0) return items;
  }

  return fetchVaultInventoryFromApi(authUserId);
}

async function getVaultAccessToken(): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) return null;
  return data.session.access_token.trim();
}

async function mutateVaultInventory(
  payload: Record<string, unknown>,
): Promise<VaultedCard[]> {
  const token = await getVaultAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("/api/vault/inventory", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as VaultInventoryResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to update vault inventory.");
  }

  if (!Array.isArray(data.items)) return [];

  return data.items
    .map((item) => normalizeVaultCard(item as unknown as Record<string, unknown>))
    .filter((item): item is VaultedCard => item !== null);
}

export async function persistVaultAdd(
  authUserId: string,
  card: VaultedCard,
): Promise<VaultedCard[]> {
  if (isSupabaseConfigured()) {
    const inserted = await insertVaultItem(authUserId, card);
    if (inserted) {
      const items = await fetchVaultItems(authUserId);
      return items.length > 0 ? items : [inserted];
    }
  }

  return mutateVaultInventory({
    userId: authUserId,
    action: "add",
    card,
  });
}

export async function persistVaultRemove(
  authUserId: string,
  vaultId: string,
): Promise<VaultedCard[]> {
  if (isSupabaseConfigured()) {
    await deleteVaultItem(authUserId, vaultId);
    return fetchVaultItems(authUserId);
  }

  return mutateVaultInventory({
    userId: authUserId,
    action: "remove",
    vaultId,
  });
}
