import { formatGems } from "../constants/retail";
import type { Json } from "../types/database";
import { logger } from "./logger";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type ExchangeVaultItemResult =
  | {
      ok: true;
      vaultItemId: string;
      gemsAdded: number;
      gemsBalance: number;
    }
  | { ok: false; error: string };

interface ExchangeRpcPayload {
  success?: boolean;
  error?: string;
  gems_added?: number;
  gems_balance?: number;
  item_id?: string;
  status?: string;
}

const inFlightExchangeIds = new Set<string>();

export interface VaultExchangeUiHandlers {
  /** Remove the exchanged card from local vault state immediately. */
  removeVaultItem: (
    vaultItemId: string,
    gemsAdded: number,
    serverGemsBalance?: number,
  ) => void;
  /** Close the reveal modal or any exchange overlay. */
  closeModal?: () => void;
  /** Display database / RPC error text (toast.error equivalent). */
  toastError: (message: string) => void;
  /** Optional success notification after manual state update. */
  toastSuccess?: (gemsAdded: number) => void;
  /** Fetch authoritative gems_balance when RPC omits credit fields. */
  syncGemBalance?: () => Promise<void>;
}

function parseRpcPayload(data: unknown): ExchangeRpcPayload | null {
  if (data == null || typeof data !== "object") return null;
  return data as ExchangeRpcPayload;
}

function mapTransportError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("not_authenticated")) {
    return "Sign in to exchange vault items.";
  }

  return message.trim() || "Unable to exchange this item. Please try again.";
}

function toCleanVaultItemId(vaultItemId: string): string {
  return vaultItemId.trim().replace("vault-", "");
}

function resolveDbError(payload: ExchangeRpcPayload | null, fallback: string): string {
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }
  return fallback;
}

/** Calls `exchange_vault_item` and returns a typed result from the JSON payload. */
export async function exchangeVaultItem(vaultItemId: string): Promise<ExchangeVaultItemResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      error: "Vault exchange requires Supabase configuration.",
    };
  }

  const sourceVaultItemId = vaultItemId.trim();
  const cleanId = toCleanVaultItemId(sourceVaultItemId);
  if (!cleanId) {
    return { ok: false, error: "Vault item not found." };
  }
  if (inFlightExchangeIds.has(cleanId)) {
    return { ok: false, error: "Exchange already in progress for this item." };
  }
  inFlightExchangeIds.add(cleanId);

  try {
    logger.log("[exchange_vault_item] RPC request");

    // @ts-expect-error Database RPC typings omit exchange_vault_item args.
    const { data, error } = await supabase.rpc("exchange_vault_item", { p_item_id: cleanId });

    if (error) {
      logger.warn("[exchange_vault_item] RPC failed:", error.message);
      return { ok: false, error: mapTransportError(error.message) };
    }

    const payload = parseRpcPayload(data as Json);

    if (payload?.success === false) {
      const dbError = resolveDbError(payload, "Unable to exchange this item.");
      logger.warn("[exchange_vault_item] success=false:", dbError);
      return { ok: false, error: dbError };
    }

    if (payload?.success !== true) {
      logger.warn("[exchange_vault_item] Invalid response");
      return {
        ok: false,
        error: resolveDbError(payload, "Exchange returned an invalid response."),
      };
    }

    const gemsAdded = Number(payload.gems_added);
    const gemsBalance = Number(payload.gems_balance);
    const normalizedAdded = Number.isFinite(gemsAdded) ? Math.round(gemsAdded) : 0;
    const normalizedBalance = Number.isFinite(gemsBalance) ? Math.round(gemsBalance) : 0;

    logger.log("[exchange_vault_item] credit applied:", {
      gemsAdded: normalizedAdded,
      gemsBalance: normalizedBalance,
    });

    return {
      ok: true,
      vaultItemId: sourceVaultItemId,
      gemsAdded: normalizedAdded,
      gemsBalance: normalizedBalance,
    };
  } finally {
    inFlightExchangeIds.delete(cleanId);
  }
}

/**
 * Runs the exchange RPC and immediately updates local UI state on success —
 * does not wait for Realtime vault sync.
 */
export async function exchangeVaultItemInUi(
  vaultItemId: string,
  handlers: VaultExchangeUiHandlers,
): Promise<void> {
  const result = await exchangeVaultItem(vaultItemId);

  if (!result.ok) {
    handlers.toastError(result.error);
    return;
  }

  logger.log("[exchangeVaultItemInUi] applying exchange:", {
    gemsAdded: result.gemsAdded,
    gemsBalance: result.gemsBalance,
  });

  handlers.removeVaultItem(result.vaultItemId, result.gemsAdded, result.gemsBalance);

  if (result.gemsAdded <= 0 && result.gemsBalance <= 0 && handlers.syncGemBalance) {
    await handlers.syncGemBalance();
  }

  handlers.closeModal?.();

  if (handlers.toastSuccess && result.gemsAdded > 0) {
    handlers.toastSuccess(result.gemsAdded);
  }
}

export function formatExchangeSuccessToast(gemsAdded: number): string {
  return `Exchange complete — +${formatGems(gemsAdded)} added to your balance.`;
}
