import type { IncomingMessage, ServerResponse } from "node:http";
import { registerDepositOrder } from "./balancesStore.js";
import { buildWinripsOrderId } from "./orderId.js";
import type {
  CreateDepositPaymentRequest,
  DepositPayCurrency,
  DepositPaymentResponse,
} from "./paymentTypes.js";

const PAY_CURRENCIES: DepositPayCurrency[] = ["sol", "ltc"];

function readEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isPayCurrency(value: unknown): value is DepositPayCurrency {
  return typeof value === "string" && PAY_CURRENCIES.includes(value as DepositPayCurrency);
}

function parseCreatePaymentBody(body: unknown): CreateDepositPaymentRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const record = body as Record<string, unknown>;
  const priceAmount = Number(record.priceAmount);
  const payCurrency = record.payCurrency;
  const userId = typeof record.userId === "string" ? record.userId.trim() : "";

  if (!Number.isFinite(priceAmount) || priceAmount < 1) {
    throw new Error("priceAmount must be at least $1.00 USD.");
  }

  if (!isPayCurrency(payCurrency)) {
    throw new Error("payCurrency must be sol or ltc.");
  }

  if (!userId) {
    throw new Error("userId is required.");
  }

  return { priceAmount, payCurrency, userId };
}

/** Creates a NOWPayments deposit invoice tied to the user's account row via order_id. */
export async function createDepositPayment(
  input: CreateDepositPaymentRequest,
): Promise<DepositPaymentResponse> {
  const apiKey = readEnv("NOWPAYMENTS_API_KEY");
  const apiUrl = readEnv("NOWPAYMENTS_API_URL").replace(/\/$/, "");
  const orderId = buildWinripsOrderId(input.userId);

  const response = await fetch(`${apiUrl}/payment`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: input.priceAmount,
      price_currency: "usd",
      pay_currency: input.payCurrency,
      order_id: orderId,
      order_description: `WinRips gem deposit for user ${input.userId}`,
    }),
  });

  const raw = await response.text();
  let data: Record<string, unknown> = {};

  try {
    data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    throw new Error("NOWPayments returned an invalid JSON response.");
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : raw || `NOWPayments request failed (${response.status}).`;
    throw new Error(message);
  }

  const payAddress = typeof data.pay_address === "string" ? data.pay_address : "";
  if (!payAddress) {
    throw new Error("NOWPayments did not return a pay_address.");
  }

  const paymentId = String(data.payment_id ?? "");
  const resolvedOrderId = typeof data.order_id === "string" ? data.order_id : orderId;

  await registerDepositOrder({
    orderId: resolvedOrderId,
    userId: input.userId,
    priceAmountUsd: input.priceAmount,
    paymentId,
  });

  return {
    paymentId,
    orderId: resolvedOrderId,
    payAddress,
    payAmount: Number(data.pay_amount ?? 0),
    payCurrency: input.payCurrency,
    priceAmount: input.priceAmount,
    priceCurrency: "usd",
  };
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

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

/**
 * Node HTTP handler for POST /api/payments/create
 * Proxies to NOWPayments without exposing the API key to the browser.
 */
export async function handlePaymentsRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = req.url?.split("?")[0];
  if (url !== "/api/payments/create" || req.method !== "POST") {
    return false;
  }

  try {
    const body = await readJsonBody(req);
    const input = parseCreatePaymentBody(body);
    const payment = await createDepositPayment(input);
    sendJson(res, 200, payment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment creation failed.";
    sendJson(res, 400, { error: message });
  }

  return true;
}
