import { normalizePackId, resolvePackGemCost } from "../data/boxCatalog";
import { RETAIL_COPY } from "../constants/retail";
import { logger } from "./logger";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export interface OpenPackWinner {
  itemId: string;
  itemName: string;
  storeRarity: string;
  gemValue: number;
  imageUrl: string;
  vaultItemId: string;
}

export type OpenPackResult =
  | {
      ok: true;
      gemsBalance: number;
      winners: OpenPackWinner[];
    }
  | {
      ok: false;
      error: string;
      code?: string;
      step?: string;
      rpcData?: OpenPackRpcPayload | null;
    };

interface OpenPackRpcPayload {
  success?: boolean;
  gems_balance?: number;
  results?: OpenPackRpcWinner[] | null;
  error?: string;
  code?: string;
  step?: string;
}

interface OpenPackRpcWinner {
  item_id?: string;
  item_name?: string;
  store_rarity?: string;
  gem_value?: number;
  image_url?: string;
  vault_item_id?: string;
}

function parseRpcPayload(data: unknown): OpenPackRpcPayload | null {
  if (data == null || typeof data !== "object") return null;
  return data as OpenPackRpcPayload;
}

function normalizeVaultItemId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mapOpenPackWinner(raw: OpenPackRpcWinner): OpenPackWinner | null {
  const itemId = typeof raw.item_id === "string" ? raw.item_id.trim() : "";
  const itemName = typeof raw.item_name === "string" ? raw.item_name.trim() : "";
  const storeRarity = typeof raw.store_rarity === "string" ? raw.store_rarity.trim() : "Common";
  const gemValue = Number(raw.gem_value);
  const imageUrl = typeof raw.image_url === "string" ? raw.image_url.trim() : "";
  const vaultItemId = normalizeVaultItemId(raw.vault_item_id);

  if (!itemId || !itemName || !vaultItemId || !Number.isFinite(gemValue) || gemValue < 0) {
    return null;
  }

  return {
    itemId,
    itemName,
    storeRarity,
    gemValue: Math.round(gemValue),
    imageUrl,
    vaultItemId,
  };
}

function mapOpenPackError(message: string, code?: string): string {
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
  if (normalized.includes("pack not found")) {
    return "This pack is not available right now.";
  }

  return "Unable to open this pack. Please try again.";
}

async function resolveAuthenticatedUserId(prefilledUserId?: string): Promise<string> {
  const trimmedPrefilled = prefilledUserId?.trim();
  if (trimmedPrefilled) {
    return trimmedPrefilled;
  }

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Pack opening requires Supabase configuration.");
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
 * Atomic pack open: server picks the card, deducts gems, and vaults in one RPC.
 * The client only receives the winner and animates toward it.
 */
export async function openPack(
  packId: string,
  spinCost: number,
  quantity: number,
  authUserId?: string,
): Promise<OpenPackResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      error: "Pack opening requires Supabase configuration.",
    };
  }

  const normalizedPackId = normalizePackId(packId.trim());
  const normalizedCost = resolvePackGemCost(normalizedPackId, spinCost);
  const normalizedQuantity = Math.max(1, Math.round(quantity));

  if (!normalizedPackId) {
    return { ok: false, error: "Invalid pack." };
  }

  if (normalizedCost <= 0) {
    return { ok: false, error: "Invalid spin cost." };
  }

  try {
    const authenticatedUserId = await resolveAuthenticatedUserId(authUserId);

    const { data, error } = await supabase.rpc(
      "open_pack",
      {
        p_user_id: authenticatedUserId,
        p_pack_id: normalizedPackId,
        p_quantity: normalizedQuantity,
        p_spin_cost: normalizedCost,
      } as never,
    );

    if (error) {
      logger.warn("[open_pack] PostgREST error:", error.message);
      return {
        ok: false,
        error: mapOpenPackError(error.message),
        code: "postgrest_error",
        step: "rpc_transport",
        rpcData: null,
      };
    }

    const payload = parseRpcPayload(data);

    if (payload?.success !== true) {
      const rpcCode =
        typeof payload?.code === "string" && payload.code.trim()
          ? payload.code.trim()
          : undefined;
      const rpcStep =
        typeof payload?.step === "string" && payload.step.trim()
          ? payload.step.trim()
          : undefined;
      const errorMessage =
        typeof payload?.error === "string" && payload.error.trim()
          ? payload.error.trim()
          : "Unable to open this pack.";

      return {
        ok: false,
        error: mapOpenPackError(errorMessage, rpcCode),
        code: rpcCode,
        step: rpcStep,
        rpcData: payload,
      };
    }

    const gemsBalance = Number(payload.gems_balance);
    if (!Number.isFinite(gemsBalance) || gemsBalance < 0) {
      throw new Error("Pack open succeeded but returned an invalid balance.");
    }

    const rawResults = Array.isArray(payload.results) ? payload.results : [];
    const winners = rawResults
      .map((entry) => mapOpenPackWinner(entry as OpenPackRpcWinner))
      .filter((entry): entry is OpenPackWinner => entry !== null);

    if (winners.length !== normalizedQuantity) {
      logger.warn("[open_pack] result count mismatch", {
        expected: normalizedQuantity,
        received: winners.length,
      });
      return {
        ok: false,
        error: "Pack open returned an incomplete result. Please try again.",
        code: "incomplete_results",
        rpcData: payload,
      };
    }

    logger.log("[open_pack] pack opened", { packId: normalizedPackId, quantity: normalizedQuantity });
    return {
      ok: true,
      gemsBalance: Math.round(gemsBalance),
      winners,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to complete this pack opening.";
    return { ok: false, error: message };
  }
}
