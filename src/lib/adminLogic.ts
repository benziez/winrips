import type { Database, Json } from "../types/database";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type FetchPendingShipmentsClient = {
  rpc(
    fn: "fetch_pending_shipments_admin",
  ): Promise<{ data: Json | null; error: { message: string } | null }>;
};

type MarkVaultItemShippedArgs =
  Database["public"]["Functions"]["mark_vault_item_shipped"]["Args"];

type MarkVaultItemShippedClient = {
  rpc(
    fn: "mark_vault_item_shipped",
    args: MarkVaultItemShippedArgs,
  ): Promise<{ data: Json | null; error: { message: string } | null }>;
};

export interface PendingShipmentOrder {
  id: string;
  userId: string;
  itemName: string;
  imageUrl: string;
  gemValue: number;
  shippingName: string;
  shippingAddress: string;
  createdAt: string;
  username: string | null;
  email: string | null;
}

export type FetchPendingShipmentsResult =
  | { ok: true; orders: PendingShipmentOrder[] }
  | { ok: false; error: string };

export type MarkVaultItemShippedResult =
  | { ok: true; itemId: string; trackingNumber: string }
  | { ok: false; error: string };

interface PendingShipmentRow {
  id?: string;
  user_id?: string;
  item_name?: string;
  image_url?: string;
  gem_value?: number;
  shipping_name?: string;
  shipping_address?: string;
  created_at?: string;
  username?: string | null;
  email?: string | null;
}

function mapAdminError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("not_authenticated")) {
    return "Sign in to access the admin dashboard.";
  }
  if (normalized.includes("not_admin")) {
    return "You do not have admin access.";
  }
  if (normalized.includes("invalid_tracking_number")) {
    return "Enter a valid tracking number.";
  }
  if (normalized.includes("item_not_pending") || normalized.includes("item_not_found")) {
    return "This order is no longer pending shipment.";
  }

  return "Unable to complete this admin action. Please try again.";
}

function parsePendingOrder(row: PendingShipmentRow): PendingShipmentOrder | null {
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const userId = typeof row.user_id === "string" ? row.user_id.trim() : "";
  const itemName = typeof row.item_name === "string" ? row.item_name.trim() : "";
  const imageUrl = typeof row.image_url === "string" ? row.image_url : "";
  const shippingName = typeof row.shipping_name === "string" ? row.shipping_name.trim() : "";
  const shippingAddress =
    typeof row.shipping_address === "string" ? row.shipping_address.trim() : "";
  const createdAt = typeof row.created_at === "string" ? row.created_at : "";
  const gemValue = Number(row.gem_value);

  if (!id || !userId || !itemName || !shippingName || !shippingAddress) {
    return null;
  }

  return {
    id,
    userId,
    itemName,
    imageUrl,
    gemValue: Number.isFinite(gemValue) && gemValue >= 0 ? Math.round(gemValue) : 0,
    shippingName,
    shippingAddress,
    createdAt,
    username: typeof row.username === "string" ? row.username.trim() || null : null,
    email: typeof row.email === "string" ? row.email.trim() || null : null,
  };
}

/** Loads all pending shipment orders for the admin fulfillment queue. */
export async function fetchPendingShipmentsAdmin(): Promise<FetchPendingShipmentsResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: "Admin dashboard requires Supabase configuration." };
  }

  const client = supabase as unknown as FetchPendingShipmentsClient;
  const { data, error } = await client.rpc("fetch_pending_shipments_admin");

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[fetch_pending_shipments_admin] RPC failed:", error.message);
    }
    return { ok: false, error: mapAdminError(error.message) };
  }

  const payload = data as { success?: boolean; orders?: PendingShipmentRow[] } | null;
  if (payload?.success !== true || !Array.isArray(payload.orders)) {
    return { ok: false, error: "Unable to load pending shipments." };
  }

  const orders = payload.orders
    .map((row) => parsePendingOrder(row))
    .filter((row): row is PendingShipmentOrder => row != null);

  return { ok: true, orders };
}

/** Marks a pending shipment as shipped with a tracking number. Admin only. */
export async function markVaultItemShipped(
  itemId: string,
  trackingNumber: string,
): Promise<MarkVaultItemShippedResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: "Admin dashboard requires Supabase configuration." };
  }

  const normalizedItemId = itemId.trim();
  const normalizedTracking = trackingNumber.trim();

  if (!normalizedItemId) {
    return { ok: false, error: "Order not found." };
  }

  if (!normalizedTracking) {
    return { ok: false, error: "Enter a valid tracking number." };
  }

  const args: MarkVaultItemShippedArgs = {
    p_item_id: normalizedItemId,
    p_tracking_number: normalizedTracking,
  };

  const client = supabase as unknown as MarkVaultItemShippedClient;
  const { data, error } = await client.rpc("mark_vault_item_shipped", args);

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[mark_vault_item_shipped] RPC failed:", error.message);
    }
    return { ok: false, error: mapAdminError(error.message) };
  }

  const payload = data as {
    success?: boolean;
    item_id?: string;
    tracking_number?: string;
  } | null;

  const returnedItemId = typeof payload?.item_id === "string" ? payload.item_id : normalizedItemId;
  const returnedTracking =
    typeof payload?.tracking_number === "string" ? payload.tracking_number : normalizedTracking;

  if (payload?.success !== true) {
    return { ok: false, error: "Shipment update returned an invalid response." };
  }

  return {
    ok: true,
    itemId: returnedItemId,
    trackingNumber: returnedTracking,
  };
}
