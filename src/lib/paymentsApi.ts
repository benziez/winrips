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

  const data = (await response.json()) as AccountBalanceResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to load account balance.");
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
