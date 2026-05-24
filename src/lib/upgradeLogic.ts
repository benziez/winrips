import type { Database, Json } from "../types/database";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type ProcessUpgradeRollArgs = Database["public"]["Functions"]["process_upgrade_roll"]["Args"];

interface ProcessUpgradeRollClient {
  rpc(
    fn: "process_upgrade_roll",
    args: ProcessUpgradeRollArgs,
  ): Promise<{ data: Json | null; error: { message: string } | null }>;
}

export type ProcessUpgradeRollResult =
  | { ok: true; won: boolean; newItemId?: string; winChance: number }
  | { ok: false; error: string };

interface UpgradeRollRpcPayload {
  success?: boolean;
  won?: boolean;
  new_item_id?: string | null;
  win_chance?: number;
}

function parseRpcPayload(data: unknown): UpgradeRollRpcPayload | null {
  if (data == null || typeof data !== "object") return null;
  return data as UpgradeRollRpcPayload;
}

function mapUpgradeError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("not_authenticated")) {
    return "Sign in to execute upgrades.";
  }
  if (normalized.includes("input_item_not_owned") || normalized.includes("input_item_not_found")) {
    return "Your deposit item could not be found.";
  }
  if (normalized.includes("input_item_not_upgradeable")) {
    return "This item cannot be used for an upgrade.";
  }
  if (normalized.includes("invalid_target_item") || normalized.includes("invalid_target")) {
    return "The selected target is not available for upgrade.";
  }

  return "Unable to process this upgrade. Please try again.";
}

/** Executes a secure server-side upgrade roll. */
export async function processUpgradeRoll(
  inputItemId: string,
  targetCatalogId: string,
): Promise<ProcessUpgradeRollResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      error: "Upgrades require Supabase configuration.",
    };
  }

  const normalizedInputId = inputItemId.trim();
  const normalizedTargetId = targetCatalogId.trim();

  if (!normalizedInputId) {
    return { ok: false, error: "Select a deposit item to upgrade." };
  }

  if (!normalizedTargetId) {
    return { ok: false, error: "Select a target item to upgrade toward." };
  }

  const args: ProcessUpgradeRollArgs = {
    p_input_item_id: normalizedInputId,
    p_target_catalog_id: normalizedTargetId,
  };

  const client = supabase as unknown as ProcessUpgradeRollClient;
  const { data, error } = await client.rpc("process_upgrade_roll", args);

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[process_upgrade_roll] RPC failed:", error.message);
    }
    return { ok: false, error: mapUpgradeError(error.message) };
  }

  const payload = parseRpcPayload(data);
  const winChance = Number(payload?.win_chance);
  const newItemId =
    typeof payload?.new_item_id === "string" ? payload.new_item_id.trim() : undefined;

  if (payload?.success !== true || typeof payload.won !== "boolean") {
    return {
      ok: false,
      error: "Upgrade roll succeeded but returned an invalid response.",
    };
  }

  if (!Number.isFinite(winChance) || winChance < 0 || winChance > 1) {
    return {
      ok: false,
      error: "Upgrade roll succeeded but returned an invalid win chance.",
    };
  }

  if (payload.won && !newItemId) {
    return {
      ok: false,
      error: "Upgrade roll succeeded but did not return the new vault item.",
    };
  }

  return {
    ok: true,
    won: payload.won,
    newItemId,
    winChance,
  };
}
