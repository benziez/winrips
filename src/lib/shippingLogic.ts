import { resolveVaultItemUuid } from "./exchangeLogic";
import { logger } from "./logger";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isShippingRpcSuccess(payload: ShippingRpcPayload | null): boolean {
  if (!payload) return false;
  if (payload.success === true) return true;
  if (payload.success === false) return false;
  if (payload.status === "pending_shipment") return true;
  return typeof payload.item_id === "string" && payload.item_id.trim().length > 0;
}

export type ProcessShippingRequestResult =
  | { ok: true; success: true; gemsBalance?: number; itemId: string; status: string }
  | { ok: false; error: string; insufficientGems?: boolean };

interface ShippingRpcPayload {
  success?: boolean;
  gems_balance?: number;
  item_id?: string;
  status?: string;
}

const inFlightShippingIds = new Set<string>();

function parseRpcPayload(data: unknown): ShippingRpcPayload | null {
  if (data == null || typeof data !== "object") return null;
  return data as ShippingRpcPayload;
}

function mapShippingError(message: string): ProcessShippingRequestResult {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("insufficient gems") ||
    normalized.includes("insufficient_gems")
  ) {
    return {
      ok: false,
      insufficientGems: true,
      error: "You don't have enough balance to cover the shipping fee.",
    };
  }
  if (normalized.includes("not_authenticated")) {
    return { ok: false, error: "Sign in to request physical delivery." };
  }
  if (normalized.includes("item_not_owned") || normalized.includes("item_not_found")) {
    return { ok: false, error: "This vault item could not be found." };
  }
  if (normalized.includes("item_not_shippable")) {
    return { ok: false, error: "This item is already queued for shipment." };
  }
  if (normalized.includes("invalid_shipping_details")) {
    return { ok: false, error: "Enter a valid name and shipping address." };
  }

  return { ok: false, error: "Unable to submit shipping request. Please try again." };
}

export interface ProcessShippingRequestInput {
  itemId: string;
  name: string;
  address: string;
}

/** Charges shipping gems and marks a vault item pending fulfillment on the server. */
export async function processShippingRequest(
  input: ProcessShippingRequestInput,
): Promise<ProcessShippingRequestResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      error: "Shipping requests require Supabase configuration.",
    };
  }

  const cleanItemId = resolveVaultItemUuid(input.itemId);
  const name = input.name.trim();
  const fullAddress = input.address.trim();

  if (!cleanItemId || !UUID_RE.test(cleanItemId)) {
    return { ok: false, error: "Vault item not found." };
  }
  if (inFlightShippingIds.has(cleanItemId)) {
    return { ok: false, error: "Shipping request already in progress for this item." };
  }

  if (!name || !fullAddress) {
    return { ok: false, error: "Enter a valid name and shipping address." };
  }

  inFlightShippingIds.add(cleanItemId);
  try {
    // @ts-expect-error Supabase client typings omit process_shipping_request args.
    const { data, error } = await supabase.rpc("process_shipping_request", {
      param_item_id: cleanItemId,
      p_address: fullAddress,
      p_name: name,
    });

    if (error) {
      console.error("[processShippingRequest] RPC error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        itemId: cleanItemId,
      });
      logger.error("RPC Error:", error);
      const rpcMessage =
        typeof error.message === "string" && error.message.trim()
          ? error.message
          : "Unable to submit shipping request. Please try again.";
      return mapShippingError(rpcMessage);
    }

    // Null/void RPC data is valid — the SQL function ran without returning a payload.
    if (data == null) {
      logger.log("Shipping requested successfully");
      return {
        ok: true,
        success: true,
        itemId: cleanItemId,
        status: "pending_shipment",
      };
    }

    const payload = parseRpcPayload(data);
    if (!payload || !isShippingRpcSuccess(payload)) {
      console.error("[processShippingRequest] RPC returned unsuccessful payload:", {
        itemId: cleanItemId,
        data,
      });
      return {
        ok: false,
        error: "Unable to submit shipping request. Please try again.",
      };
    }

    logger.log("Shipping requested successfully");

    const gemsBalance = Number(payload.gems_balance);
    const status =
      typeof payload.status === "string" && payload.status.trim()
        ? payload.status
        : "pending_shipment";
    const returnedItemId = typeof payload.item_id === "string" ? payload.item_id : cleanItemId;

    return {
      ok: true,
      success: true,
      gemsBalance:
        Number.isFinite(gemsBalance) && gemsBalance >= 0 ? Math.round(gemsBalance) : undefined,
      itemId: returnedItemId,
      status,
    };
  } finally {
    inFlightShippingIds.delete(cleanItemId);
  }
}

export interface VaultShippingUiHandlers {
  onShipped: (vaultItemId: string, serverGemsBalance?: number) => void;
  toastError: (message: string) => void;
  toastSuccess?: (message: string) => void;
  closeModal?: () => void;
  invalidateBalanceQueries?: () => Promise<void>;
  syncGemBalance?: () => Promise<void>;
}

/** Runs the shipping RPC and updates local UI immediately — does not block on vault refetch. */
export async function shipVaultItemInUi(
  vaultItemId: string,
  input: { name: string; address: string },
  handlers: VaultShippingUiHandlers,
): Promise<boolean> {
  const result = await processShippingRequest({
    itemId: vaultItemId,
    name: input.name,
    address: input.address,
  });

  if (!result.ok) {
    handlers.toastError(result.error);
    return false;
  }

  const shippedId =
    typeof result.itemId === "string" && result.itemId.trim()
      ? resolveVaultItemUuid(result.itemId)
      : resolveVaultItemUuid(vaultItemId);

  logger.log("[shipVaultItemInUi] applying shipping:", {
    vaultItemId: shippedId,
    gemsBalance: result.gemsBalance,
    status: result.status,
  });

  handlers.onShipped(shippedId, result.gemsBalance);

  if (handlers.invalidateBalanceQueries) {
    await handlers.invalidateBalanceQueries();
  }

  if (handlers.syncGemBalance) {
    await handlers.syncGemBalance();
  }

  handlers.toastSuccess?.("Shipping confirmed — tracking will be emailed");
  handlers.closeModal?.();

  return true;
}
