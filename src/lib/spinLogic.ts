import { RETAIL_COPY } from "../constants/retail";
import type { Database, Json } from "../types/database";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type ProcessSpinTransactionArgs =
  Database["public"]["Functions"]["process_spin_transaction"]["Args"];

interface ProcessSpinTransactionClient {
  rpc(
    fn: "process_spin_transaction",
    args: ProcessSpinTransactionArgs,
  ): Promise<{ data: Json | null; error: { message: string } | null }>;
}

export type ProcessSpinTransactionResult =
  | { ok: true; gemsBalance: number }
  | { ok: false; error: string };

interface SpinTransactionRpcPayload {
  success?: boolean;
  gems_balance?: number;
}

function parseRpcPayload(data: unknown): SpinTransactionRpcPayload | null {
  if (data == null || typeof data !== "object") return null;
  const record = data as SpinTransactionRpcPayload;
  return record;
}

function mapSpinChargeError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("insufficient_gems")) {
    return `Insufficient ${RETAIL_COPY.currency} for this opening.`;
  }
  if (normalized.includes("not_authenticated")) {
    return "Sign in to unlock drops with your gem balance.";
  }
  if (normalized.includes("invalid_spin_cost")) {
    return "Invalid spin cost.";
  }
  if (normalized.includes("profile_not_found")) {
    return "Account profile not found. Try signing out and back in.";
  }

  return "Unable to charge gems for this spin. Please try again.";
}

/**
 * Charges the authenticated user's gem balance on the server before a spin proceeds.
 * Must succeed before the client rolls or animates the pack open.
 */
export async function processSpinTransaction(
  userId: string,
  spinCost: number,
): Promise<ProcessSpinTransactionResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      error: "Spin charging requires Supabase configuration.",
    };
  }

  const normalizedUserId = userId.trim();
  const normalizedCost = Math.max(0, Math.round(spinCost));

  if (!normalizedUserId) {
    return { ok: false, error: "Sign in to unlock drops with your gem balance." };
  }

  if (normalizedCost <= 0) {
    return { ok: false, error: "Invalid spin cost." };
  }

  const args: ProcessSpinTransactionArgs = {
    p_user_id: normalizedUserId,
    p_spin_cost: normalizedCost,
  };

  const client = supabase as unknown as ProcessSpinTransactionClient;
  const { data, error } = await client.rpc("process_spin_transaction", args);

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[process_spin_transaction] RPC failed:", error.message);
    }
    return { ok: false, error: mapSpinChargeError(error.message) };
  }

  const payload = parseRpcPayload(data);
  const gemsBalance = Number(payload?.gems_balance);

  if (payload?.success !== true || !Number.isFinite(gemsBalance) || gemsBalance < 0) {
    return {
      ok: false,
      error: "Spin charge succeeded but returned an invalid balance.",
    };
  }

  return { ok: true, gemsBalance: Math.round(gemsBalance) };
}
