import type { IncomingMessage, ServerResponse } from "node:http";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { requireAuthenticatedUserId } from "./verifySupabaseSession.js";
import { logger } from "./logger.js";
import { isStripeRoute } from "./stripeRouteMatch.js";

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readStripeSecret(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Stripe is not configured on the server.");
  }
  return key;
}

function readSupabaseAdmin() {
  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error("Database is not configured on the server.");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function readKycReturnUrl(): string {
  const explicit = process.env.STRIPE_KYC_RETURN_URL?.trim();
  if (explicit) return explicit;

  const apiBase = process.env.VITE_API_BASE_URL?.trim()?.replace(/\/$/, "");
  if (apiBase) return `${apiBase}/kyc-complete`;

  return "https://winrips.app/kyc-complete";
}

async function requireAuth(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<string | null> {
  try {
    return await requireAuthenticatedUserId(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    sendJson(res, 401, { error: message });
    return null;
  }
}

export async function handleStripeKycSessionRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (!isStripeRoute(req, "POST", "kyc-session")) {
    return false;
  }

  const userId = await requireAuth(req, res);
  if (!userId) return true;

  try {
    const supabase = readSupabaseAdmin();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("kyc_verified")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      sendJson(res, 404, { error: "User not found" });
      return true;
    }

    if (profile.kyc_verified === true) {
      sendJson(res, 200, { already_verified: true });
      return true;
    }

    const stripe = new Stripe(readStripeSecret());
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      options: {
        document: {
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      metadata: { user_id: userId },
      return_url: readKycReturnUrl(),
    });

    if (!session.url) {
      sendJson(res, 500, { error: "Verification session could not be created" });
      return true;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ kyc_verification_session_id: session.id })
      .eq("id", userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    sendJson(res, 200, {
      url: session.url,
      session_id: session.id,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "KYC session creation failed";
    logger.error("[stripe/kyc-session]", message);
    sendJson(res, 500, { error: message });
    return true;
  }
}

export async function handleStripeIdentityWebhookEvent(
  event: Stripe.Event,
  supabase: ReturnType<typeof readSupabaseAdmin>,
): Promise<void> {
  if (event.type === "identity.verification_session.verified") {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId =
      session.metadata?.user_id?.trim() ?? session.metadata?.supabase_user_id?.trim() ?? "";

    if (!userId) {
      logger.error("[stripe/webhook] identity verified missing user_id metadata", session.id);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        kyc_verified: true,
        kyc_verification_session_id: session.id,
      })
      .eq("id", userId);

    if (error) {
      logger.error("[stripe/webhook] kyc_verified update failed:", error.message);
    }
    return;
  }

  if (event.type === "identity.verification_session.requires_input") {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId =
      session.metadata?.user_id?.trim() ?? session.metadata?.supabase_user_id?.trim() ?? "";

    if (!userId) {
      logger.warn("[stripe/webhook] identity requires_input missing user_id", session.id);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ kyc_verification_session_id: session.id })
      .eq("id", userId);

    if (error) {
      logger.error("[stripe/webhook] kyc session update failed:", error.message);
    }
  }
}
