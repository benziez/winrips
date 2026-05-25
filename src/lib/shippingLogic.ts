import { logger } from "./logger";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

function toCleanVaultItemId(vaultItemId: string): string {
  return vaultItemId.trim().replace(/^vault-/, "");
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
      error: "You don't have enough gems for shipping.",
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

  const cleanItemId = toCleanVaultItemId(input.itemId);
  const name = input.name.trim();
  const fullAddress = input.address.trim();

  if (!cleanItemId) {
    return { ok: false, error: "Vault item not found." };
  }

  if (!name || !fullAddress) {
    return { ok: false, error: "Enter a valid name and shipping address." };
  }

  // @ts-expect-error Supabase client typings omit process_shipping_request args.
  const { data, error } = await supabase.rpc("process_shipping_request", {
    param_item_id: cleanItemId,
    p_address: fullAddress,
    p_name: name,
  });

  if (error) {
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
      status: "shipping_requested",
    };
  }

  const payload = parseRpcPayload(data);
  if (!payload?.success) {
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
      : "shipping_requested";
  const returnedItemId = typeof payload.item_id === "string" ? payload.item_id : cleanItemId;

  return {
    ok: true,
    success: true,
    gemsBalance:
      Number.isFinite(gemsBalance) && gemsBalance >= 0 ? Math.round(gemsBalance) : undefined,
    itemId: returnedItemId,
    status,
  };
}
