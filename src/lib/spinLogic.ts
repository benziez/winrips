import { RETAIL_COPY } from "../constants/retail";
import type { Database, Json } from "../types/database";
import { logger } from "./logger";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type ProcessSpinTransactionArgs =
  Database["public"]["Functions"]["process_spin_transaction"]["Args"];

type AddToVaultArgs = Database["public"]["Functions"]["add_to_vault"]["Args"];

interface SpinRpcClient {
  rpc(
    fn: "process_spin_transaction",
    args: ProcessSpinTransactionArgs,
  ): Promise<{ data: Json | null; error: { message: string } | null }>;
  rpc(
    fn: "add_to_vault",
    args: AddToVaultArgs,
  ): Promise<{ data: Json | null; error: { message: string } | null }>;
}

export interface HandleSpinItemDetails {
  itemId: string;
  itemName: string;
  gemValue: number;
  imageUrl: string;
}

export type HandleSpinResult =
  | {
      ok: true;
      gemsBalance: number;
      vaultItemId?: string;
      vaultPending?: boolean;
      vaultPendingMessage?: string;
    }
  | {
      ok: false;
      error: string;
      code?: string;
      step?: string;
      rpcData?: SpinRpcPayload | null;
    };

interface SpinRpcPayload {
  success?: boolean;
  gems_balance?: number;
  vault_item_id?: string | null;
  error?: string;
  code?: string;
  step?: string;
}

function parseRpcPayload(data: unknown): SpinRpcPayload | null {
  if (data == null || typeof data !== "object") return null;
  return data as SpinRpcPayload;
}

function normalizeVaultItemId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mapSpinChargeError(message: string, code?: string): string {
  const normalized = `${code ?? ""} ${message}`.toLowerCase();

  if (normalized.includes("insufficient_gems") || normalized.includes("insufficient gems")) {
    return `Insufficient ${RETAIL_COPY.currency} for this opening.`;
  }
  if (normalized.includes("not_authenticated")) {
    return "Sign in to unlock drops with your account balance.";
  }
  if (normalized.includes("invalid_spin_cost")) {
    return "Invalid spin cost.";
  }
  if (normalized.includes("profile_not_found")) {
    return "Account profile not found. Try signing out and back in.";
  }

  return "Unable to charge your balance for this spin. Please try again.";
}

async function resolveAuthenticatedUserId(prefilledUserId?: string): Promise<string> {
  const trimmedPrefilled = prefilledUserId?.trim();
  if (trimmedPrefilled) {
    return trimmedPrefilled;
  }

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Spin charging requires Supabase configuration.");
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error("Sign in to unlock drops with your account balance.");
  }

  const userId = data.session?.user?.id?.trim();
  if (!userId) {
    throw new Error("Sign in to unlock drops with your account balance.");
  }

  return userId;
}

/**
 * Two-step spin flow: charge gems via `process_spin_transaction`, then register the
 * pull via `add_to_vault`. Prefer `authUserId` from app state; falls back to local session.
 */
export async function handleSpin(
  spinCost: number,
  item: HandleSpinItemDetails,
  authUserId?: string,
): Promise<HandleSpinResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      error: "Spin charging requires Supabase configuration.",
    };
  }

  const normalizedCost = Math.max(0, Math.round(spinCost));
  const itemId = item.itemId.trim();
  const itemName = item.itemName.trim();
  const imageUrl = item.imageUrl.trim();
  const gemValue = Math.max(0, Math.round(item.gemValue));

  if (normalizedCost <= 0) {
    return { ok: false, error: "Invalid spin cost." };
  }

  if (!itemId || !itemName) {
    return { ok: false, error: "Invalid pull item details." };
  }

  try {
    const authenticatedUserId = await resolveAuthenticatedUserId(authUserId);
    const client = supabase as unknown as SpinRpcClient;

    const { data: spinData, error: spinError } = await client.rpc("process_spin_transaction", {
      p_user_id: authenticatedUserId,
      p_spin_cost: normalizedCost,
    });

    if (spinError) {
      logger.warn("[process_spin_transaction] PostgREST error:", spinError.message);
      return {
        ok: false,
        error: mapSpinChargeError(spinError.message),
        code: "postgrest_error",
        step: "rpc_transport",
        rpcData: null,
      };
    }

    const spinPayload = parseRpcPayload(spinData);

    if (spinPayload?.success !== true) {
      const rpcCode =
        typeof spinPayload?.code === "string" && spinPayload.code.trim()
          ? spinPayload.code.trim()
          : undefined;
      const rpcStep =
        typeof spinPayload?.step === "string" && spinPayload.step.trim()
          ? spinPayload.step.trim()
          : undefined;
      const errorMessage =
        typeof spinPayload?.error === "string" && spinPayload.error.trim()
          ? spinPayload.error.trim()
          : "Unable to charge your balance for this spin.";

      return {
        ok: false,
        error: mapSpinChargeError(errorMessage, rpcCode),
        code: rpcCode,
        step: rpcStep,
        rpcData: spinPayload,
      };
    }

    const gemsBalance = Number(spinPayload.gems_balance);
    if (!Number.isFinite(gemsBalance) || gemsBalance < 0) {
      throw new Error("Spin charge succeeded but returned an invalid balance.");
    }

    try {
      // @ts-expect-error Database RPC typings omit add_to_vault args.
      const { data: vaultData, error: vaultError } = await supabase.rpc("add_to_vault", {
        p_user_id: authenticatedUserId,
        p_item_id: itemId,
        p_item_name: itemName,
        p_gem_value: gemValue,
        p_image_url: imageUrl,
      });

      const vaultPayload = parseRpcPayload(vaultData);
      const vaultItemId = normalizeVaultItemId(vaultPayload?.vault_item_id);

      if (vaultItemId) {
        logger.log("[add_to_vault] vault item registered");
        return {
          ok: true,
          gemsBalance: Math.round(gemsBalance),
          vaultItemId,
        };
      }

      if (vaultError) {
        logger.warn("[add_to_vault] RPC failed:", vaultError.message);
        return {
          ok: true,
          gemsBalance: Math.round(gemsBalance),
          vaultPending: true,
          vaultPendingMessage: "Spin succeeded but vaulting is pending.",
        };
      }

      if (vaultPayload?.success === false) {
        const vaultErrorMessage =
          typeof vaultPayload.error === "string" && vaultPayload.error.trim()
            ? vaultPayload.error.trim()
            : "Vault registration did not complete.";
        logger.warn("[add_to_vault] returned failure:", vaultErrorMessage);
        return {
          ok: true,
          gemsBalance: Math.round(gemsBalance),
          vaultPending: true,
          vaultPendingMessage: "Spin succeeded but vaulting is pending.",
        };
      }

      logger.warn("[add_to_vault] missing vault item id in response");
      return {
        ok: true,
        gemsBalance: Math.round(gemsBalance),
        vaultPending: true,
        vaultPendingMessage: "Spin succeeded but vaulting is pending.",
      };
    } catch (vaultUnexpectedError) {
      const message =
        vaultUnexpectedError instanceof Error
          ? vaultUnexpectedError.message
          : "Vault registration failed.";
      logger.warn("[add_to_vault] unexpected error:", message);
      return {
        ok: true,
        gemsBalance: Math.round(gemsBalance),
        vaultPending: true,
        vaultPendingMessage: "Spin succeeded but vaulting is pending.",
      };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to complete this spin.";
    return { ok: false, error: message };
  }
}
