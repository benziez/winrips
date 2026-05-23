/**
 * Resolves the IPN callback URL sent to NOWPayments as `ipn_callback_url` on each payment.
 *
 * Env (first match wins):
 * - `NOWPAYMENTS_IPN_CALLBACK_URL` — full URL, e.g. https://abc.ngrok-free.app/api/payments/webhook
 * - `NOWPAYMENTS_TUNNEL_URL` — tunnel origin only; `/api/payments/webhook` is appended
 */
export function resolveNowPaymentsIpnCallbackUrl(): string | undefined {
  const explicit = process.env.NOWPAYMENTS_IPN_CALLBACK_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const tunnelBase = process.env.NOWPAYMENTS_TUNNEL_URL?.trim();
  if (tunnelBase) {
    const base = tunnelBase.replace(/\/$/, "");
    return `${base}/api/payments/webhook`;
  }

  return undefined;
}

export function isLocalDevelopment(): boolean {
  const nodeEnv = (process.env.NODE_ENV ?? "").toLowerCase();
  return nodeEnv === "development" || nodeEnv === "test";
}

export function warnIfMissingDevIpnCallback(): void {
  if (!isLocalDevelopment()) return;
  if (resolveNowPaymentsIpnCallbackUrl()) return;

  console.warn(
    "[payments] No NOWPAYMENTS_IPN_CALLBACK_URL or NOWPAYMENTS_TUNNEL_URL — local deposits will not auto-credit. Run `npm run dev:tunnel` (ngrok) and set the printed URL in .env. Do not use localtunnel for IPN; NOWPayments cannot bypass its reminder page.",
  );
}
