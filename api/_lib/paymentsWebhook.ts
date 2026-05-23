import type { IncomingMessage, ServerResponse } from "node:http";
import {
  creditGemsFromDeposit,
  getUserBalance,
  hasProcessedPayment,
  parseWinripsOrderId,
  usdToGems,
} from "./balancesStore.js";
import {
  getNowPaymentsSignatureHeader,
  verifyNowPaymentsIpnSignature,
} from "./nowpaymentsIpnSignature.js";
import { logWebhook } from "./webhookLog.js";

/** NOWPayments IPN statuses that trigger gem credit. */
const CREDIT_STATUSES = new Set(["finished", "confirmed"]);

export interface NowPaymentsIpnPayload {
  payment_id?: string | number;
  payment_status?: string;
  order_id?: string;
  price_amount?: number | string;
  actually_paid?: number | string;
  pay_amount?: number | string;
  pay_currency?: string;
  price_currency?: string;
}

type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

async function readRawBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function parseJsonBody(rawBody: string): NowPaymentsIpnPayload {
  if (!rawBody.trim()) return {};
  return JSON.parse(rawBody) as NowPaymentsIpnPayload;
}

function verifyIpnRequest(req: IncomingMessage, rawBody: string): VerifyResult {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
  if (!secret) {
    return { ok: false, reason: "missing_ipn_secret_env" };
  }

  const signature = getNowPaymentsSignatureHeader(req);
  if (!signature) {
    return { ok: false, reason: "missing_x_nowpayments_sig_header" };
  }

  if (!rawBody.trim()) {
    return { ok: false, reason: "empty_request_body" };
  }

  if (!verifyNowPaymentsIpnSignature(rawBody, signature, secret)) {
    return { ok: false, reason: "signature_mismatch" };
  }

  return { ok: true };
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function resolveGemsToCredit(payload: NowPaymentsIpnPayload): number {
  const priceUsd = Number(payload.price_amount ?? 0);
  if (Number.isFinite(priceUsd) && priceUsd > 0) {
    return usdToGems(priceUsd);
  }

  const paidUsd = Number(payload.actually_paid ?? 0);
  if (Number.isFinite(paidUsd) && paidUsd > 0) {
    return usdToGems(paidUsd);
  }

  return 0;
}

function ipnContext(body: NowPaymentsIpnPayload) {
  return {
    paymentId: body.payment_id != null ? String(body.payment_id) : null,
    paymentStatus: String(body.payment_status ?? "").toLowerCase() || null,
    orderId: typeof body.order_id === "string" ? body.order_id : null,
    priceAmount: body.price_amount ?? null,
    payCurrency: body.pay_currency ?? null,
  };
}

/**
 * POST /api/payments/webhook — NOWPayments IPN listener.
 * Credits gem_balance when payment_status is finished or confirmed.
 *
 * IPN is an inbound POST from NOWPayments only (signature verified locally via
 * x-nowpayments-sig). We do not call NOWPayments again from this handler.
 *
 * Localtunnel shows a browser "reminder" unless the client sends
 * `Bypass-Tunnel-Reminder: true`. NOWPayments cannot attach custom IPN headers, so
 * localtunnel will block gem auto-credit. Use ngrok for local dev (`npm run dev:tunnel`).
 */
export async function handlePaymentsWebhookRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = req.url?.split("?")[0];
  if (url !== "/api/payments/webhook" || req.method !== "POST") {
    return false;
  }

  let rawBody = "";
  let httpStatus = 500;
  let outcome = "error";

  try {
    rawBody = await readRawBody(req);

    logWebhook("received", {
      bodyBytes: rawBody.length,
      hasIpnSecret: Boolean(process.env.NOWPAYMENTS_IPN_SECRET?.trim()),
      hasSignatureHeader: Boolean(getNowPaymentsSignatureHeader(req)),
    });

    const verification = verifyIpnRequest(req, rawBody);
    if (!verification.ok) {
      outcome = verification.reason;
      httpStatus = verification.reason === "missing_ipn_secret_env" ? 500 : 401;
      logWebhook("signature_failed", {
        reason: verification.reason,
        bodyBytes: rawBody.length,
        ...safeBodyPreview(rawBody),
      });
      sendJson(res, httpStatus, { error: "Unauthorized", reason: verification.reason });
      return true;
    }

    logWebhook("signature_ok", { bodyBytes: rawBody.length });

    const body = parseJsonBody(rawBody);
    const ctx = ipnContext(body);
    const paymentStatus = ctx.paymentStatus ?? "";

    if (!CREDIT_STATUSES.has(paymentStatus)) {
      outcome = "ignored_status";
      httpStatus = 200;
      logWebhook("ignored_status", { ...ctx, paymentStatus });
      sendJson(res, 200, { ok: true, ignored: true, paymentStatus });
      return true;
    }

    const orderId = ctx.orderId ?? "";
    const parsed = parseWinripsOrderId(orderId);

    if (!parsed) {
      outcome = "invalid_order_id";
      httpStatus = 400;
      logWebhook("invalid_order_id", { ...ctx, orderId });
      sendJson(res, 400, { error: "Invalid or missing order_id." });
      return true;
    }

    const paymentId = ctx.paymentId;

    if (paymentId && (await hasProcessedPayment(paymentId))) {
      const balance = await getUserBalance(parsed.userId);
      outcome = "duplicate_payment";
      httpStatus = 200;
      logWebhook("duplicate_payment", {
        ...ctx,
        userId: parsed.userId,
        gemBalance: balance.gemBalance,
      });
      sendJson(res, 200, {
        ok: true,
        duplicate: true,
        userId: parsed.userId,
        gemBalance: balance.gemBalance,
      });
      return true;
    }

    const gems = resolveGemsToCredit(body);
    if (gems <= 0) {
      outcome = "invalid_gem_amount";
      httpStatus = 400;
      logWebhook("invalid_gem_amount", {
        ...ctx,
        userId: parsed.userId,
        priceAmount: body.price_amount,
        actuallyPaid: body.actually_paid,
      });
      sendJson(res, 400, { error: "Unable to resolve USD amount for gem credit." });
      return true;
    }

    const result = await creditGemsFromDeposit({
      userId: parsed.userId,
      gems,
      paymentId,
      orderId,
      paymentStatus,
    });

    outcome = result.credited ? "credited" : "duplicate_not_credited";
    httpStatus = 200;
    logWebhook(outcome, {
      ...ctx,
      userId: parsed.userId,
      gemsRequested: gems,
      gemsAdded: result.gems,
      gemBalance: result.gemBalance,
      credited: result.credited,
      duplicate: result.duplicate,
    });

    sendJson(res, 200, {
      ok: true,
      credited: result.credited,
      duplicate: result.duplicate,
      userId: parsed.userId,
      gemsAdded: result.gems,
      gemBalance: result.gemBalance,
      orderId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    outcome = "exception";
    httpStatus = 500;
    logWebhook("exception", {
      error: message,
      bodyBytes: rawBody.length,
      ...safeBodyPreview(rawBody),
    });
    sendJson(res, 500, { error: message });
  } finally {
    logWebhook("completed", { outcome, httpStatus });
  }

  return true;
}

function safeBodyPreview(rawBody: string): { bodyPreview?: string } {
  if (!rawBody.trim()) return {};
  return { bodyPreview: rawBody.slice(0, 500) };
}
