import type { IncomingMessage, ServerResponse } from "node:http";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { requireAuthenticatedUserId } from "./verifySupabaseSession.js";
import { logger } from "./logger.js";

const MIN_WITHDRAWAL_USD = 5;
const WEEKLY_CAP_CENTS = 25_000;
const TAX_THRESHOLD_CENTS = 60_000;

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

function readConnectBaseUrl(): string {
  const fromEnv =
    process.env.STRIPE_CONNECT_RETURN_BASE_URL?.trim() ??
    process.env.VITE_API_BASE_URL?.trim() ??
    "https://www.winrips.com";
  return fromEnv.replace(/\/$/, "");
}

function connectAccountUrl(suffix: "return" | "refresh"): string {
  return `${readConnectBaseUrl()}/account?stripe_connect=${suffix}`;
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

async function getProfileConnectFields(userId: string) {
  const supabase = readSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "stripe_connect_account_id, withdrawable_balance, gems_balance, kyc_verified, kyc_verification_session_id, total_withdrawn_ytd, withdrawn_ytd_year, tax_info_collected",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("User not found");
  }

  const currentYear = new Date().getFullYear();
  const storedYear = Number(data.withdrawn_ytd_year) || null;
  const ytdRaw = Math.max(0, Math.round(Number(data.total_withdrawn_ytd) || 0));
  const totalWithdrawnYtdCents =
    storedYear === null || storedYear !== currentYear ? 0 : ytdRaw;

  return {
    stripeConnectAccountId: (data.stripe_connect_account_id as string | null)?.trim() ?? "",
    withdrawableBalance: Math.max(0, Math.round(Number(data.withdrawable_balance) || 0)),
    gemsBalance: Math.max(0, Math.round(Number(data.gems_balance) || 0)),
    kycVerified: data.kyc_verified === true,
    kycVerificationSessionId:
      typeof data.kyc_verification_session_id === "string"
        ? data.kyc_verification_session_id.trim()
        : "",
    totalWithdrawnYtdCents,
    taxInfoCollected: data.tax_info_collected === true,
  };
}

async function sumRecentWithdrawalsCents(userId: string): Promise<number> {
  const supabase = readSupabaseAdmin();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("withdrawals")
    .select("amount_cents")
    .eq("user_id", userId)
    .in("status", ["pending", "completed"])
    .gte("created_at", since);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce(
    (sum, row) => sum + Math.max(0, Math.round(Number(row.amount_cents) || 0)),
    0,
  );
}

export async function handleStripeConnectStatusRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (req.method !== "GET" || req.url !== "/api/stripe/connect-status") {
    return false;
  }

  const userId = await requireAuth(req, res);
  if (!userId) return true;

  try {
    const profile = await getProfileConnectFields(userId);
    let payoutsEnabled = false;
    let detailsSubmitted = false;

    if (profile.stripeConnectAccountId) {
      const stripe = new Stripe(readStripeSecret());
      const account = await stripe.accounts.retrieve(profile.stripeConnectAccountId);
      payoutsEnabled = Boolean(account.payouts_enabled);
      detailsSubmitted = Boolean(account.details_submitted);
    }

    const recentWithdrawnCents = await sumRecentWithdrawalsCents(userId);
    const weeklyRemainingCents = Math.max(0, WEEKLY_CAP_CENTS - recentWithdrawnCents);

    sendJson(res, 200, {
      stripe_connect_account_id: profile.stripeConnectAccountId || null,
      payouts_enabled: payoutsEnabled,
      details_submitted: detailsSubmitted,
      withdrawable_balance_gems: profile.withdrawableBalance,
      weekly_withdrawn_cents: recentWithdrawnCents,
      weekly_remaining_cents: weeklyRemainingCents,
      kyc_verified: profile.kycVerified,
      kyc_verification_session_id: profile.kycVerificationSessionId || null,
      total_withdrawn_ytd_cents: profile.totalWithdrawnYtdCents,
      tax_info_collected: profile.taxInfoCollected,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connect status lookup failed";
    logger.error("[stripe/connect-status]", message);
    sendJson(res, 500, { error: message });
    return true;
  }
}

export async function handleStripeCreateConnectAccountRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (req.method !== "POST" || req.url !== "/api/stripe/connect-account") {
    return false;
  }

  const userId = await requireAuth(req, res);
  if (!userId) return true;

  try {
    const supabase = readSupabaseAdmin();
    const profile = await getProfileConnectFields(userId);

    if (profile.stripeConnectAccountId) {
      sendJson(res, 200, { account_id: profile.stripeConnectAccountId });
      return true;
    }

    const stripe = new Stripe(readStripeSecret());
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      capabilities: { transfers: { requested: true } },
      business_type: "individual",
      metadata: { supabase_user_id: userId },
    });

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stripe_connect_account_id: account.id })
      .eq("id", userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    sendJson(res, 200, { account_id: account.id });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connect account creation failed";
    logger.error("[stripe/connect-account]", message);
    sendJson(res, 500, { error: message });
    return true;
  }
}

export async function handleStripeCreateOnboardingLinkRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (req.method !== "POST" || req.url !== "/api/stripe/onboarding-link") {
    return false;
  }

  const userId = await requireAuth(req, res);
  if (!userId) return true;

  try {
    const profile = await getProfileConnectFields(userId);
    if (!profile.stripeConnectAccountId) {
      sendJson(res, 400, { error: "Connect account not set up. Create an account first." });
      return true;
    }

    const stripe = new Stripe(readStripeSecret());
    const link = await stripe.accountLinks.create({
      account: profile.stripeConnectAccountId,
      refresh_url: connectAccountUrl("refresh"),
      return_url: connectAccountUrl("return"),
      type: "account_onboarding",
    });

    if (!link.url) {
      sendJson(res, 500, { error: "Onboarding link creation failed" });
      return true;
    }

    sendJson(res, 200, { url: link.url });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onboarding link creation failed";
    logger.error("[stripe/onboarding-link]", message);
    sendJson(res, 500, { error: message });
    return true;
  }
}

export async function handleStripeWithdrawRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (req.method !== "POST" || req.url !== "/api/stripe/withdraw") {
    return false;
  }

  const userId = await requireAuth(req, res);
  if (!userId) return true;

  const body = (await readJsonBody(req)) as { amount_usd?: unknown };
  const amountUsd = Number(body.amount_usd);

  if (!Number.isFinite(amountUsd) || amountUsd < MIN_WITHDRAWAL_USD) {
    sendJson(res, 400, { error: `Minimum withdrawal is $${MIN_WITHDRAWAL_USD}` });
    return true;
  }

  const amountCents = Math.round(amountUsd * 100);
  if (amountCents <= 0) {
    sendJson(res, 400, { error: "Invalid withdrawal amount" });
    return true;
  }

  try {
    const profile = await getProfileConnectFields(userId);

    if (!profile.kycVerified) {
      sendJson(res, 403, {
        error: "Identity verification required before withdrawing.",
        code: "kyc_required",
      });
      return true;
    }

    if (
      profile.totalWithdrawnYtdCents >= TAX_THRESHOLD_CENTS &&
      !profile.taxInfoCollected
    ) {
      sendJson(res, 403, {
        error: "Tax information required before further withdrawals.",
        code: "tax_info_required",
      });
      return true;
    }

    if (!profile.stripeConnectAccountId) {
      sendJson(res, 400, { error: "Withdrawals are not set up. Complete onboarding first." });
      return true;
    }

    const stripe = new Stripe(readStripeSecret());
    const account = await stripe.accounts.retrieve(profile.stripeConnectAccountId);

    if (!account.payouts_enabled) {
      sendJson(res, 400, { error: "Bank account setup is incomplete. Finish onboarding first." });
      return true;
    }

    if (profile.withdrawableBalance < amountCents) {
      sendJson(res, 400, { error: "Insufficient withdrawable balance" });
      return true;
    }

    const recentWithdrawnCents = await sumRecentWithdrawalsCents(userId);
    if (recentWithdrawnCents + amountCents > WEEKLY_CAP_CENTS) {
      sendJson(res, 400, { error: "Weekly withdrawal limit exceeded ($250 per 7 days)" });
      return true;
    }

    const supabase = readSupabaseAdmin();
    const { data: debitData, error: debitError } = await supabase.rpc("debit_withdrawal", {
      p_user_id: userId,
      p_amount_cents: amountCents,
    });

    if (debitError) {
      throw new Error(debitError.message);
    }

    const debit = debitData as { success?: boolean; error?: string; withdrawal_id?: string };
    if (!debit?.success || !debit.withdrawal_id) {
      const code = debit?.error ?? "withdrawal_debit_failed";
      if (code === "insufficient_withdrawable_balance") {
        sendJson(res, 400, { error: "Insufficient withdrawable balance" });
        return true;
      }
      if (code === "weekly_cap_exceeded") {
        sendJson(res, 400, { error: "Weekly withdrawal limit exceeded ($250 per 7 days)" });
        return true;
      }
      sendJson(res, 400, { error: "Withdrawal could not be processed" });
      return true;
    }

    const withdrawalId = debit.withdrawal_id;

    try {
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: "usd",
        destination: profile.stripeConnectAccountId,
        metadata: {
          supabase_user_id: userId,
          withdrawal_id: withdrawalId,
        },
      });

      const { error: markError } = await supabase.rpc("mark_withdrawal_status", {
        p_withdrawal_id: withdrawalId,
        p_status: "completed",
        p_stripe_transfer_id: transfer.id,
        p_reverse: false,
      });

      if (markError) {
        logger.error("[stripe/withdraw] mark completed failed:", markError.message);
      }

      sendJson(res, 200, {
        success: true,
        withdrawal_id: withdrawalId,
        transfer_id: transfer.id,
        amount_cents: amountCents,
      });
      return true;
    } catch (transferError) {
      const message =
        transferError instanceof Error ? transferError.message : "Stripe transfer failed";
      logger.error("[stripe/withdraw] transfer failed:", message);

      const { error: reverseError } = await supabase.rpc("mark_withdrawal_status", {
        p_withdrawal_id: withdrawalId,
        p_status: "reversed",
        p_stripe_transfer_id: null,
        p_reverse: true,
      });

      if (reverseError) {
        logger.error("[stripe/withdraw] reversal failed:", reverseError.message);
      }

      sendJson(res, 502, { error: "Transfer failed. Your balance has been restored." });
      return true;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Withdrawal failed";
    logger.error("[stripe/withdraw]", message);
    sendJson(res, 500, { error: message });
    return true;
  }
}
