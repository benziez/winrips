import type {
  AccountBalanceResponse,
  CreateDepositPaymentRequest,
  DepositPayCurrency,
  DepositPaymentResponse,
} from "../types/payments";

const URI_SCHEME_PREFIXES = new Set([
  "bitcoin",
  "btc",
  "litecoin",
  "ltc",
  "solana",
  "sol",
]);

/**
 * Raw QR payload for exchange apps (Coinbase, etc.) — address only, no `bitcoin:` / `solana:` URI.
 */
export function normalizeDepositQrAddress(rawAddress: string): string {
  let value = rawAddress.trim();
  if (!value) return value;

  const colonIndex = value.indexOf(":");
  if (colonIndex > 0) {
    const scheme = value.slice(0, colonIndex).toLowerCase();
    if (URI_SCHEME_PREFIXES.has(scheme)) {
      value = value.slice(colonIndex + 1);
    }
  }

  return value.split("?")[0]?.split("#")[0]?.trim() ?? value;
}
import { supabase } from "./supabaseClient";

const CREATE_PAYMENT_PATH = "/api/payments/create";

async function getDepositAccessToken(): Promise<string> {
  if (!supabase) {
    throw new Error("Sign in required to create a deposit.");
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error("Unable to read session. Please sign in again.");
  }

  const token = data.session?.access_token?.trim();
  if (!token) {
    throw new Error("Sign in required to create a deposit.");
  }

  return token;
}

export async function requestDepositPayment(
  payload: CreateDepositPaymentRequest,
): Promise<DepositPaymentResponse> {
  const accessToken = await getDepositAccessToken();

  const response = await fetch(CREATE_PAYMENT_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as DepositPaymentResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to create crypto deposit.");
  }

  return data;
}

export async function fetchAccountBalance(userId: string): Promise<AccountBalanceResponse> {
  const params = new URLSearchParams({ userId });
  const response = await fetch(`/api/account/balance?${params.toString()}`);

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const snippet = (await response.text()).slice(0, 120);
    throw new Error(
      `Balance API returned non-JSON (${response.status}). Check that /api routes are deployed as serverless functions, not rewritten to index.html. ${snippet}`,
    );
  }

  const data = (await response.json()) as AccountBalanceResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to load account balance.");
  }

  return data;
}

const DEV_SET_BALANCE_PATH = "/api/account/balance/dev-set";

/** Dev-only: set absolute gem balance (requires VITE_DEV_BALANCE_SECRET + server DEV_BALANCE_SECRET). */
export async function setDevGemBalance(
  userId: string,
  gemBalance = 5000,
): Promise<AccountBalanceResponse & { ok?: boolean }> {
  const secret = import.meta.env.VITE_DEV_BALANCE_SECRET?.trim();
  if (!secret) {
    throw new Error("Set VITE_DEV_BALANCE_SECRET in .env to use dev balance tools.");
  }

  const response = await fetch(DEV_SET_BALANCE_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-dev-balance-secret": secret,
    },
    body: JSON.stringify({ userId, gemBalance }),
  });

  const data = (await response.json()) as AccountBalanceResponse & {
    ok?: boolean;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to set dev balance.");
  }

  return data;
}

export function depositQrCodeUrl(
  payAddress: string,
  payCurrency?: DepositPayCurrency,
  size = 220,
): string {
  const shouldStripUri =
    payCurrency === "btc" || payCurrency === "sol" || payCurrency === "ltc";
  const qrPayload = shouldStripUri ? normalizeDepositQrAddress(payAddress) : payAddress.trim();

  const params = new URLSearchParams({
    size: `${size}x${size}`,
    margin: "12",
    data: qrPayload,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}
