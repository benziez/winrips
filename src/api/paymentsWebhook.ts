import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getNowPaymentsSignatureHeader,
  verifyNowPaymentsIpnSignature,
} from "../../server/nowpaymentsIpnSignature.mjs";
import { parseWinripsOrderId } from "./orderId";

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

type BalancesStore = {
  usdToGems: (usd: number | string) => number;
  parseWinripsOrderId: (orderId: string) => { userId: string } | null;
  hasProcessedPayment: (paymentId: string) => boolean;
  getUserBalance: (userId: string) => { gemBalance: number; tokenBalance: number };
  creditGemsFromDeposit: (input: {
    userId: string;
    gems: number;
    paymentId: string | null;
    orderId: string;
    paymentStatus: string;
  }) => {
    credited: boolean;
    duplicate: boolean;
    gemBalance: number;
    gems: number;
  };
};

async function loadBalancesStore(): Promise<BalancesStore> {
  return import("../../server/balancesStore.mjs") as Promise<BalancesStore>;
}

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

function rejectUnauthorized(res: ServerResponse): void {
  sendJson(res, 401, { error: "Unauthorized" });
}

function verifyIpnRequest(req: IncomingMessage, rawBody: string): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret?.trim()) return false;

  const signature = getNowPaymentsSignatureHeader(req);
  return verifyNowPaymentsIpnSignature(rawBody, signature, secret);
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function resolveGemsToCredit(
  payload: NowPaymentsIpnPayload,
  store: BalancesStore,
): number {
  const priceUsd = Number(payload.price_amount ?? 0);
  if (Number.isFinite(priceUsd) && priceUsd > 0) {
    return store.usdToGems(priceUsd);
  }
  return 0;
}

/**
 * POST /api/payments/webhook — NOWPayments IPN listener.
 * Credits gem_balance when payment_status is finished or confirmed.
 */
export async function handlePaymentsWebhookRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = req.url?.split("?")[0];
  if (url !== "/api/payments/webhook" || req.method !== "POST") {
    return false;
  }

  try {
    const rawBody = await readRawBody(req);

    if (!verifyIpnRequest(req, rawBody)) {
      rejectUnauthorized(res);
      return true;
    }

    const body = parseJsonBody(rawBody);
    const paymentStatus = String(body.payment_status ?? "").toLowerCase();

    if (!CREDIT_STATUSES.has(paymentStatus)) {
      sendJson(res, 200, { ok: true, ignored: true, paymentStatus });
      return true;
    }

    const orderId = typeof body.order_id === "string" ? body.order_id : "";
    const store = await loadBalancesStore();
    const parsed = parseWinripsOrderId(orderId) ?? store.parseWinripsOrderId(orderId);

    if (!parsed) {
      sendJson(res, 400, { error: "Invalid or missing order_id." });
      return true;
    }

    const paymentId = body.payment_id != null ? String(body.payment_id) : null;

    if (paymentId && store.hasProcessedPayment(paymentId)) {
      const balance = store.getUserBalance(parsed.userId);
      sendJson(res, 200, {
        ok: true,
        duplicate: true,
        userId: parsed.userId,
        gemBalance: balance.gemBalance,
      });
      return true;
    }

    const gems = resolveGemsToCredit(body, store);
    if (gems <= 0) {
      sendJson(res, 400, { error: "Unable to resolve USD amount for gem credit." });
      return true;
    }

    const result = store.creditGemsFromDeposit({
      userId: parsed.userId,
      gems,
      paymentId,
      orderId,
      paymentStatus,
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
    sendJson(res, 500, { error: message });
  }

  return true;
}
