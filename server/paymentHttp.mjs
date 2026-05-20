import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  creditGemsFromDeposit,
  getUserBalance,
  hasProcessedPayment,
  parseWinripsOrderId,
  registerDepositOrder,
  usdToGems,
} from "./balancesStore.mjs";
import {
  getNowPaymentsSignatureHeader,
  verifyNowPaymentsIpnSignature,
} from "./nowpaymentsIpnSignature.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const CREDIT_STATUSES = new Set(["finished", "confirmed"]);

function loadDotEnv() {
  const envPath = path.join(root, "..", ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonBody(req) {
  const text = await readRawBody(req);
  return text.trim() ? JSON.parse(text) : {};
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function createDepositPayment(input) {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  const apiUrl = (process.env.NOWPAYMENTS_API_URL ?? "").replace(/\/$/, "");
  if (!apiKey || !apiUrl) throw new Error("NOWPayments is not configured.");

  const orderId = `winrips-${input.userId}-${Date.now()}`;
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
  const data = raw ? JSON.parse(raw) : {};
  if (!response.ok) {
    throw new Error(data.message ?? raw ?? `NOWPayments error ${response.status}`);
  }
  if (!data.pay_address) throw new Error("NOWPayments did not return pay_address.");

  const paymentId = String(data.payment_id ?? "");
  const resolvedOrderId = data.order_id ?? orderId;

  await registerDepositOrder({
    orderId: resolvedOrderId,
    userId: input.userId,
    priceAmountUsd: input.priceAmount,
    paymentId,
  });

  return {
    paymentId,
    orderId: resolvedOrderId,
    payAddress: data.pay_address,
    payAmount: Number(data.pay_amount ?? 0),
    payCurrency: input.payCurrency,
    priceAmount: input.priceAmount,
    priceCurrency: "usd",
  };
}

async function handleCreate(req, res) {
  const body = await readJsonBody(req);
  const priceAmount = Number(body.priceAmount);
  const payCurrency = body.payCurrency;
  const userId = String(body.userId ?? "").trim();

  if (!Number.isFinite(priceAmount) || priceAmount < 1) {
    throw new Error("priceAmount must be at least $1.00 USD.");
  }
  if (payCurrency !== "sol" && payCurrency !== "ltc") {
    throw new Error("payCurrency must be sol or ltc.");
  }
  if (!userId) throw new Error("userId is required.");

  const payment = await createDepositPayment({ priceAmount, payCurrency, userId });
  sendJson(res, 200, payment);
}

async function handleWebhook(req, res) {
  const rawBody = await readRawBody(req);
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  const signature = getNowPaymentsSignatureHeader(req);

  if (
    !secret?.trim() ||
    !verifyNowPaymentsIpnSignature(rawBody, signature, secret)
  ) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  const body = rawBody.trim() ? JSON.parse(rawBody) : {};
  const paymentStatus = String(body.payment_status ?? "").toLowerCase();

  if (!CREDIT_STATUSES.has(paymentStatus)) {
    sendJson(res, 200, { ok: true, ignored: true, paymentStatus });
    return;
  }

  const orderId = typeof body.order_id === "string" ? body.order_id : "";
  const parsed = parseWinripsOrderId(orderId);

  if (!parsed) {
    sendJson(res, 400, { error: "Invalid or missing order_id." });
    return;
  }

  const paymentId = body.payment_id != null ? String(body.payment_id) : null;

  if (paymentId && hasProcessedPayment(paymentId)) {
    const balance = getUserBalance(parsed.userId);
    sendJson(res, 200, {
      ok: true,
      duplicate: true,
      userId: parsed.userId,
      gemBalance: balance.gemBalance,
    });
    return;
  }

  const gems = usdToGems(body.price_amount);
  if (gems <= 0) {
    sendJson(res, 400, { error: "Unable to resolve USD amount for gem credit." });
    return;
  }

  const result = await creditGemsFromDeposit({
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
}

function handleBalance(req, res, url) {
  const userId = url.searchParams.get("userId")?.trim() ?? "";
  if (!userId) {
    sendJson(res, 400, { error: "userId query parameter is required." });
    return;
  }
  const balance = getUserBalance(userId);
  sendJson(res, 200, balance);
}

export async function handlePaymentHttp(req, res) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname;

  try {
    if (pathname === "/api/payments/webhook" && req.method === "POST") {
      await handleWebhook(req, res);
      return true;
    }

    if (pathname === "/api/account/balance" && req.method === "GET") {
      await handleBalance(req, res, url);
      return true;
    }

    if (pathname === "/api/payments/create" && req.method === "POST") {
      await handleCreate(req, res);
      return true;
    }
  } catch (error) {
    sendJson(res, 400, {
      error: error instanceof Error ? error.message : "Request failed.",
    });
    return true;
  }

  return false;
}

export function createPaymentsServer() {
  loadDotEnv();
  return http.createServer(async (req, res) => {
    const handled = await handlePaymentHttp(req, res);
    if (!handled) {
      sendJson(res, 404, { error: "Not found" });
    }
  });
}
