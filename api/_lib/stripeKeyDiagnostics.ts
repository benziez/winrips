/** Stripe API key mode from prefix only — never log full keys. */
export type StripeKeyMode = "test" | "live" | "unknown" | "missing";

export function stripeSecretKeyMode(secretKey: string | undefined): StripeKeyMode {
  const key = secretKey?.trim() ?? "";
  if (!key) return "missing";
  if (key.startsWith("sk_test_") || key.startsWith("rk_test_")) return "test";
  if (key.startsWith("sk_live_") || key.startsWith("rk_live_")) return "live";
  return "unknown";
}

export function stripePublishableKeyMode(publishableKey: string | undefined): StripeKeyMode {
  const key = publishableKey?.trim() ?? "";
  if (!key) return "missing";
  if (key.startsWith("pk_test_")) return "test";
  if (key.startsWith("pk_live_")) return "live";
  return "unknown";
}

export function stripeKeyPrefix(key: string | undefined): string | null {
  const trimmed = key?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.slice(0, 8);
}

export function getStripeSecretKeyDiagnostics(secretKey: string | undefined): {
  configured: boolean;
  keyPrefix: string | null;
  mode: StripeKeyMode;
} {
  const trimmed = secretKey?.trim() ?? "";
  return {
    configured: Boolean(trimmed),
    keyPrefix: stripeKeyPrefix(trimmed),
    mode: stripeSecretKeyMode(trimmed),
  };
}

/** Redact PaymentIntent client_secret for logs. */
export function redactPaymentIntentClientSecret(clientSecret: string): string {
  const trimmed = clientSecret.trim();
  const parts = trimmed.split("_secret_");
  if (parts.length >= 2) {
    return `${parts[0]}_secret_[redacted]`;
  }
  return `${trimmed.slice(0, 12)}…`;
}
