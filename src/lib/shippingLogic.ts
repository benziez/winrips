import { RETAIL_COPY } from "../constants/retail";
import type { Database, Json } from "../types/database";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type ProcessShippingRequestArgs =
  Database["public"]["Functions"]["process_shipping_request"]["Args"];

interface ProcessShippingRequestClient {
  rpc(
    fn: "process_shipping_request",
    args: ProcessShippingRequestArgs,
  ): Promise<{ data: Json | null; error: { message: string } | null }>;
}

export type ProcessShippingRequestResult =
  | { ok: true; gemsBalance: number; itemId: string; status: string }
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

  if (normalized.includes("insufficient_gems")) {
    return {
      ok: false,
      insufficientGems: true,
      error: `Insufficient ${RETAIL_COPY.currency} for shipping. Deposit more funds to continue.`,
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
  shippingCost: number;
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

  const itemId = input.itemId.trim();
  const shippingCost = Math.max(0, Math.round(input.shippingCost));
  const name = input.name.trim();
  const address = input.address.trim();

  if (!itemId) {
    return { ok: false, error: "Vault item not found." };
  }

  if (shippingCost <= 0) {
    return { ok: false, error: "Invalid shipping cost." };
  }

  if (!name || !address) {
    return { ok: false, error: "Enter a valid name and shipping address." };
  }

  const args: ProcessShippingRequestArgs = {
    p_item_id: itemId,
    p_shipping_cost: shippingCost,
    p_name: name,
    p_address: address,
  };

  const client = supabase as unknown as ProcessShippingRequestClient;
  const { data, error } = await client.rpc("process_shipping_request", args);

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[process_shipping_request] RPC failed:", error.message);
    }
    return mapShippingError(error.message);
  }

  const payload = parseRpcPayload(data);
  const gemsBalance = Number(payload?.gems_balance);
  const status = typeof payload?.status === "string" ? payload.status : "";
  const returnedItemId = typeof payload?.item_id === "string" ? payload.item_id : itemId;

  if (payload?.success !== true || !Number.isFinite(gemsBalance) || gemsBalance < 0 || !status) {
    return {
      ok: false,
      error: "Shipping request succeeded but returned an invalid response.",
    };
  }

  return {
    ok: true,
    gemsBalance: Math.round(gemsBalance),
    itemId: returnedItemId,
    status,
  };
}
