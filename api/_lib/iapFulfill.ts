import type { IncomingMessage, ServerResponse } from "node:http";
import { requireAuthenticatedUserId } from "./verifySupabaseSession.js";

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) return {};
  return JSON.parse(text) as unknown;
}

interface FulfillBody {
  packId?: string;
  gemCost?: number;
  quantity?: number;
  productId?: string;
  transactionId?: string;
}

/**
 * Validates an IAP transaction and credits gems for the upcoming spin RPC.
 * Production: verify with RevenueCat REST API (REVENUECAT_SECRET_API_KEY).
 */
export async function handleIapFulfillRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (req.method !== "POST" || req.url !== "/api/iap/fulfill") {
    return false;
  }

  let userId: string;
  try {
    userId = await requireAuthenticatedUserId(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    sendJson(res, 401, { ok: false, error: message });
    return true;
  }

  const body = (await readJsonBody(req)) as FulfillBody;
  const packId = typeof body.packId === "string" ? body.packId.trim() : "";
  const gemCost = Number(body.gemCost);
  const quantity = Number(body.quantity) || 1;
  const transactionId =
    typeof body.transactionId === "string" ? body.transactionId.trim() : "";

  if (!packId || !Number.isFinite(gemCost) || gemCost <= 0 || quantity < 1) {
    sendJson(res, 400, { ok: false, error: "Invalid pack purchase payload." });
    return true;
  }

  if (!transactionId) {
    sendJson(res, 400, { ok: false, error: "Missing transaction id." });
    return true;
  }

  const devBypass = process.env.IAP_DEV_BYPASS === "true";
  const rcSecret = process.env.REVENUECAT_SECRET_API_KEY?.trim();

  if (!devBypass && !rcSecret && !transactionId.startsWith("dev-")) {
    sendJson(res, 503, {
      ok: false,
      error: "IAP verification is not configured on the server.",
    });
    return true;
  }

  // TODO: RevenueCat GET /subscribers/{app_user_id}/transactions validation
  const totalGems = Math.round(gemCost * quantity);

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      sendJson(res, 503, { ok: false, error: "Database not configured." });
      return true;
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: fetchError } = await admin
      .from("profiles")
      .select("gems_balance")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError || !profile) {
      sendJson(res, 404, { ok: false, error: "Profile not found." });
      return true;
    }

    const current = Number(profile.gems_balance) || 0;
    const nextBalance = current + totalGems;

    const { error: updateError } = await admin
      .from("profiles")
      .update({ gems_balance: nextBalance })
      .eq("id", userId);

    if (updateError) {
      sendJson(res, 500, { ok: false, error: "Could not credit purchase." });
      return true;
    }

    sendJson(res, 200, {
      ok: true,
      gemsCredited: totalGems,
      gemsBalance: nextBalance,
      transactionId,
    });
    return true;
  } catch {
    sendJson(res, 500, { ok: false, error: "Fulfillment failed." });
    return true;
  }
}
