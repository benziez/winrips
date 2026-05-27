import type { IncomingMessage, ServerResponse } from "node:http";
import { purgeUserFromBalanceStore } from "./balancesStore.js";
import { logger } from "./logger.js";
import { requireAuthenticatedUserId } from "./verifySupabaseSession.js";

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readSupabaseAdminConfig(): { url: string; serviceKey: string } | null {
  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

function readSupabaseAuthConfig(): { url: string; anonKey: string } | null {
  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ""
  ).trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function isPendingShipmentRpcError(message: string, details: string): boolean {
  const combined = `${message} ${details}`.toLowerCase();
  return combined.includes("pending_shipment");
}

/** POST /api/account/delete — permanently deletes the authenticated user and their data. */
export async function handleAccountDeleteRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname !== "/api/account/delete" || req.method !== "POST") {
    return false;
  }

  if (!readSupabaseAuthConfig() || !readSupabaseAdminConfig()) {
    sendJson(res, 503, {
      error: "Account deletion is not configured.",
      code: "not_configured",
    });
    return true;
  }

  let userId: string;
  try {
    userId = await requireAuthenticatedUserId(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication required.";
    sendJson(res, 401, { error: message, code: "unauthorized" });
    return true;
  }

  const adminConfig = readSupabaseAdminConfig()!;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(adminConfig.url, adminConfig.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: rpcError } = await admin.rpc("delete_account_for_user", {
      target_user_id: userId,
    });

    if (rpcError) {
      const message = rpcError.message ?? "";
      const details = typeof rpcError.details === "string" ? rpcError.details : "";

      if (isPendingShipmentRpcError(message, details)) {
        sendJson(res, 409, {
          code: "pending_shipment",
          error:
            "You have a shipment in progress. Complete or contact support before deleting your account.",
        });
        return true;
      }

      logger.error("[accountDelete] RPC failed:", { userId, message, details });
      sendJson(res, 500, {
        code: "rpc_failed",
        error: "Account could not be deleted. Try again or contact support.",
      });
      return true;
    }

    try {
      await purgeUserFromBalanceStore(userId);
    } catch (kvError) {
      logger.error("[accountDelete] KV purge failed after RPC commit:", { userId, kvError });
      sendJson(res, 500, {
        code: "kv_failed",
        error: "Account could not be deleted. Try again or contact support.",
      });
      return true;
    }

    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      const authMessage = authDeleteError.message ?? "";
      const alreadyRemoved =
        authMessage.toLowerCase().includes("not found") ||
        authMessage.toLowerCase().includes("user not found");

      if (!alreadyRemoved) {
        logger.error("[accountDelete] auth.admin.deleteUser failed after data wipe:", {
          userId,
          authMessage,
        });
        sendJson(res, 500, {
          code: "auth_delete_failed",
          error: "Account could not be deleted. Try again or contact support.",
        });
        return true;
      }
    }

    sendJson(res, 200, { ok: true });
    return true;
  } catch (error) {
    logger.error("[accountDelete] unexpected failure:", { userId, error });
    sendJson(res, 500, {
      code: "internal_error",
      error: "Account could not be deleted. Try again or contact support.",
    });
    return true;
  }
}
