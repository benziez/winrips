import type { IncomingMessage, ServerResponse } from "node:http";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { requireAuthenticatedUserId } from "./verifySupabaseSession.js";
import { logger } from "./logger.js";
import { handleStripeIdentityWebhookEvent } from "./stripeKyc.js";
import {
  getStripeSecretKeyDiagnostics,
  redactPaymentIntentClientSecret,
  stripeSecretKeyMode,
} from "./stripeKeyDiagnostics.js";

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

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
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

const STRIPE_IDENTITY_WEBHOOK_EVENTS = new Set([
  "identity.verification_session.verified",
  "identity.verification_session.requires_input",
]);

function isStripeIdentityWebhookEvent(eventType: string | undefined): boolean {
  return eventType != null && STRIPE_IDENTITY_WEBHOOK_EVENTS.has(eventType);
}

function readStripeWebhookSecret(eventType: string | undefined): string | null {
  if (isStripeIdentityWebhookEvent(eventType)) {
    return process.env.STRIPE_IDENTITY_WEBHOOK_SECRET?.trim() ?? null;
  }
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? null;
}

const DEPOSIT_SUCCESS_STATUSES = new Set<Stripe.PaymentIntent.Status>([
  "succeeded",
  "processing",
  "requires_capture",
]);

const DEPOSIT_PENDING_STATUSES = new Set<Stripe.PaymentIntent.Status>([
  "requires_action",
  "requires_confirmation",
]);

export async function handleStripePaymentIntentStatusRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (req.method !== "POST" || req.url !== "/api/stripe/payment-intent-status") {
    return false;
  }

  let userId: string;
  try {
    userId = await requireAuthenticatedUserId(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    sendJson(res, 401, { error: message });
    return true;
  }

  const body = (await readJsonBody(req)) as { payment_intent_id?: unknown };
  const paymentIntentId =
    typeof body.payment_intent_id === "string" ? body.payment_intent_id.trim() : "";

  if (!paymentIntentId.startsWith("pi_")) {
    sendJson(res, 400, { error: "Invalid payment_intent_id" });
    return true;
  }

  try {
    const stripe = new Stripe(readStripeSecret());
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const ownerId = intent.metadata.supabase_user_id?.trim();
    const purpose = intent.metadata.purpose?.trim();

    if (purpose !== "balance_deposit" || ownerId !== userId) {
      sendJson(res, 404, { error: "Payment not found" });
      return true;
    }

    const status = intent.status;
    sendJson(res, 200, {
      status,
      succeeded: DEPOSIT_SUCCESS_STATUSES.has(status),
      pending: DEPOSIT_PENDING_STATUSES.has(status),
      livemode: intent.livemode,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status check failed";
    logger.error("[stripe/payment-intent-status]", message);
    sendJson(res, 500, { error: message });
    return true;
  }
}

export async function handleStripeCreatePaymentIntentRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (req.method !== "POST" || req.url !== "/api/stripe/create-payment-intent") {
    return false;
  }

  let userId: string;
  try {
    userId = await requireAuthenticatedUserId(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    sendJson(res, 401, { error: message });
    return true;
  }

  const body = (await readJsonBody(req)) as { amount_usd?: unknown };
  const amountUsd = Number(body.amount_usd);

  if (!Number.isFinite(amountUsd) || amountUsd < 1 || amountUsd > 10_000) {
    sendJson(res, 400, { error: "Amount must be between $1 and $10,000" });
    return true;
  }

  try {
    const supabase = readSupabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      sendJson(res, 404, { error: "User not found" });
      return true;
    }

    const secretKey = readStripeSecret();
    const secretDiagnostics = getStripeSecretKeyDiagnostics(secretKey);

    // Safely log only the first 8 characters (sk_live_ / sk_test_)
    console.log(
      "DEBUG_STRIPE_KEY_PREFIX:",
      process.env.STRIPE_SECRET_KEY?.substring(0, 8),
    );

    logger.critical(
      `[stripe/create-payment-intent] Stripe secret key prefix=${secretDiagnostics.keyPrefix ?? "(missing)"} mode=${secretDiagnostics.mode} amountUsd=${amountUsd}`,
    );

    const stripe = new Stripe(secretKey);

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountUsd * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        supabase_user_id: userId,
        purpose: "balance_deposit",
      },
    });

    if (!intent.client_secret) {
      sendJson(res, 500, { error: "Payment intent creation failed" });
      return true;
    }

    const piMode = intent.livemode ? "live" : "test";
    const secretMode = stripeSecretKeyMode(secretKey);
    if (secretMode !== "unknown" && secretMode !== piMode) {
      logger.critical(
        `[stripe/create-payment-intent] WARNING secret key mode (${secretMode}) does not match PaymentIntent.livemode (${piMode})`,
      );
    }

    logger.critical(
      `[stripe/create-payment-intent] created paymentIntentId=${intent.id} livemode=${intent.livemode} clientSecret=${redactPaymentIntentClientSecret(intent.client_secret)} — native app must use matching pk_${piMode}_ publishable key`,
    );

    sendJson(res, 200, {
      client_secret: intent.client_secret,
      payment_intent_id: intent.id,
      /** Lets the app detect test/live PI without reading the secret. */
      livemode: intent.livemode,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment intent creation failed";
    logger.error("[stripe/create-payment-intent]", message);
    sendJson(res, 500, { error: message });
    return true;
  }
}

export async function handleStripeWebhookRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (req.method !== "POST" || req.url !== "/api/stripe/webhook") {
    return false;
  }

  const signature = req.headers["stripe-signature"];
  const sig = Array.isArray(signature) ? signature[0] : signature;
  if (!sig) {
    sendJson(res, 400, { error: "Missing stripe-signature header" });
    return true;
  }

  const rawBody = await readRawBody(req);

  let eventType: string | undefined;
  try {
    const parsed = JSON.parse(rawBody.toString("utf8")) as { type?: string };
    eventType = typeof parsed.type === "string" ? parsed.type : undefined;
  } catch {
    sendJson(res, 400, { error: "Invalid payload" });
    return true;
  }

  const webhookSecret = readStripeWebhookSecret(eventType);
  if (!webhookSecret) {
    const message = isStripeIdentityWebhookEvent(eventType)
      ? "Stripe Identity webhook is not configured"
      : "Stripe webhook is not configured";
    sendJson(res, 503, { error: message });
    return true;
  }

  let event: Stripe.Event;

  try {
    const stripe = new Stripe(readStripeSecret());
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    logger.error(
      `[stripe/webhook] signature verification failed (${eventType ?? "unknown"}):`,
      message,
    );
    sendJson(res, 400, { error: "Invalid signature" });
    return true;
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const supabaseUserId = intent.metadata.supabase_user_id?.trim();
    const purpose = intent.metadata.purpose?.trim();

    if (purpose !== "balance_deposit") {
      sendJson(res, 200, { received: true, skipped: "not_deposit" });
      return true;
    }

    if (!supabaseUserId) {
      logger.error("[stripe/webhook] missing supabase_user_id for intent", intent.id);
      sendJson(res, 400, { error: "Missing user metadata" });
      return true;
    }

    try {
      const supabase = readSupabaseAdmin();
      const { error } = await supabase.rpc("credit_deposit", {
        p_user_id: supabaseUserId,
        p_amount_cents: intent.amount,
        p_stripe_payment_intent_id: intent.id,
      });

      if (error) {
        logger.error("[stripe/webhook] credit_deposit failed:", error.message);
        sendJson(res, 500, { error: "Credit failed" });
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Credit failed";
      logger.error("[stripe/webhook]", message);
      sendJson(res, 500, { error: "Credit failed" });
      return true;
    }

    sendJson(res, 200, { received: true });
    return true;
  }

  if (
    event.type === "identity.verification_session.verified" ||
    event.type === "identity.verification_session.requires_input"
  ) {
    try {
      const supabase = readSupabaseAdmin();
      await handleStripeIdentityWebhookEvent(event, supabase);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Identity webhook failed";
      logger.error("[stripe/webhook]", message);
      sendJson(res, 500, { error: "Identity webhook failed" });
      return true;
    }

    sendJson(res, 200, { received: true });
    return true;
  }

  sendJson(res, 200, { received: true });
  return true;
}
