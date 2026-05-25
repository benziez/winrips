import { isSupabaseConfigured } from "../lib/supabaseClient";
import { fetchVaultLockerItems, fetchVaultItems } from "../lib/vaultItems";
import { fetchUserVaultInventory } from "../lib/userVault";
import type { VaultedCard } from "../types";

/** Strict locker filter — only `status === 'vaulted'`. */
export function filterStrictlyVaulted(items: VaultedCard[]): VaultedCard[] {
  return items.filter((item) => item.status === "vaulted");
}

export function isStrictlyVaulted(card: VaultedCard): boolean {
  return card.status === "vaulted";
}

export async function fetchVaultInventory(userId: string): Promise<VaultedCard[]> {
  if (isSupabaseConfigured()) {
    const lockerItems = await fetchVaultLockerItems(userId);
    return filterStrictlyVaulted(lockerItems);
  }

  const items = await fetchUserVaultInventory(userId);
  return filterStrictlyVaulted(items);
}

/** @deprecated Use `fetchVaultInventory` + query `select`. */
export async function fetchVaultedInventory(userId: string): Promise<VaultedCard[]> {
  return fetchVaultInventory(userId);
}

/** Fallback when Supabase returns all non-exchanged rows. */
export async function fetchVaultInventoryUnfiltered(userId: string): Promise<VaultedCard[]> {
  if (isSupabaseConfigured()) {
    return fetchVaultItems(userId);
  }
  return fetchUserVaultInventory(userId);
}
