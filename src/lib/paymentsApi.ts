import type {
  AccountBalanceResponse,
  CreateDepositPaymentRequest,
  DepositPaymentResponse,
} from "../types/payments";

const CREATE_PAYMENT_PATH = "/api/payments/create";

export async function requestDepositPayment(
  payload: CreateDepositPaymentRequest,
): Promise<DepositPaymentResponse> {
  const response = await fetch(CREATE_PAYMENT_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export function depositQrCodeUrl(payAddress: string, size = 220): string {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    margin: "12",
    data: payAddress,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}
