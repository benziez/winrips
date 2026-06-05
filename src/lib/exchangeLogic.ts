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
      withdrawableBalance: number;
    }
  | { ok: false; error: string };

interface ExchangeRpcPayload {
  success?: boolean;
  error?: string;
  gems_added?: number;
  gems_balance?: number;
  withdrawable_balance?: number;
  item_id?: string;
  status?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const inFlightExchangeIds = new Set<string>();

export interface VaultExchangeUiHandlers {
  /** Remove the exchanged card from local vault state immediately. */
  removeVaultItem: (
    vaultItemId: string,
    gemsAdded: number,
    serverGemsBalance?: number,
    serverWithdrawableBalance?: number,
  ) => void;
  /** Close the reveal modal or any exchange overlay. */
  closeModal?: () => void;
  /** Display database / RPC error text (toast.error equivalent). */
  toastError: (message: string) => void;
  /** Optional success notification after manual state update. */
  toastSuccess?: (gemsAdded: number) => void;
  /** Fetch authoritative gems_balance when RPC omits credit fields. */
  syncGemBalance?: () => Promise<void>;
  /** Invalidate cached wallet/vault queries (React Query). */
  invalidateBalanceQueries?: () => Promise<void>;
}

function parseRpcPayload(data: unknown): ExchangeRpcPayload | null {
  if (data == null) return null;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as ExchangeRpcPayload;
    } catch {
      return null;
    }
  }
  if (typeof data === "object") return data as ExchangeRpcPayload;
  return null;
}

function mapTransportError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("not_authenticated")) {
    return "Sign in to exchange vault items.";
  }
  if (normalized.includes("pgrst202") || normalized.includes("could not find the function")) {
    return "Sell is unavailable — exchange_vault_item RPC is not deployed.";
  }
  if (normalized.includes("item_not_found")) {
    return "Vault item not found.";
  }
  if (normalized.includes("item_not_exchangeable")) {
    return "This item cannot be sold.";
  }
  if (normalized.includes("invalid input syntax for type uuid")) {
    return "Invalid vault item id.";
  }

  return message.trim() || "Unable to exchange this item. Please try again.";
}

/** Resolve the Supabase vault_items primary key (UUID) for RPC calls. */
export function resolveVaultItemUuid(vaultItemId: string): string {
  const trimmed = vaultItemId.trim();
  if (UUID_RE.test(trimmed)) return trimmed;
  return trimmed.replace(/^vault-/, "");
}

function resolveDbError(payload: ExchangeRpcPayload | null, fallback: string): string {
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }
  return fallback;
}

function readFiniteInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
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
  const cleanId = resolveVaultItemUuid(sourceVaultItemId);
  if (!cleanId || !UUID_RE.test(cleanId)) {
    return { ok: false, error: "Vault item not found." };
  }
  if (inFlightExchangeIds.has(cleanId)) {
    return { ok: false, error: "Exchange already in progress for this item." };
  }
  inFlightExchangeIds.add(cleanId);

  try {
    logger.log("[exchange_vault_item] RPC request", { vaultItemId: cleanId });

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
      logger.warn("[exchange_vault_item] Invalid response", payload);
      return {
        ok: false,
        error: resolveDbError(payload, "Exchange returned an invalid response."),
      };
    }

    const gemsAdded = readFiniteInt(payload.gems_added) ?? 0;
    const gemsBalance = readFiniteInt(payload.gems_balance);
    const withdrawableBalance = readFiniteInt(payload.withdrawable_balance);

    if (gemsAdded <= 0) {
      logger.warn("[exchange_vault_item] success without gems_added", payload);
      return {
        ok: false,
        error: "Exchange completed without a credit amount. Please try again.",
      };
    }

    logger.log("[exchange_vault_item] credit applied:", {
      gemsAdded,
      gemsBalance,
      withdrawableBalance,
    });

    return {
      ok: true,
      vaultItemId: sourceVaultItemId,
      gemsAdded,
      gemsBalance: gemsBalance ?? 0,
      withdrawableBalance: withdrawableBalance ?? 0,
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
): Promise<boolean> {
  const result = await exchangeVaultItem(vaultItemId);

  if (!result.ok) {
    handlers.toastError(result.error);
    return false;
  }

  logger.log("[exchangeVaultItemInUi] applying exchange:", {
    gemsAdded: result.gemsAdded,
    gemsBalance: result.gemsBalance,
    withdrawableBalance: result.withdrawableBalance,
  });

  handlers.removeVaultItem(
    result.vaultItemId,
    result.gemsAdded,
    result.gemsBalance > 0 ? result.gemsBalance : undefined,
    result.withdrawableBalance > 0 ? result.withdrawableBalance : undefined,
  );

  if (handlers.invalidateBalanceQueries) {
    await handlers.invalidateBalanceQueries();
  }

  if (handlers.syncGemBalance) {
    await handlers.syncGemBalance();
  }

  handlers.closeModal?.();

  if (handlers.toastSuccess && result.gemsAdded > 0) {
    handlers.toastSuccess(result.gemsAdded);
  }

  return true;
}

export function formatExchangeSuccessToast(gemsAdded: number): string {
  return `Exchange complete — +${formatGems(gemsAdded)} added to your balance.`;
}
