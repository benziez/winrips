import { supabase } from "./supabaseClient";
import { apiUrl } from "../utils/apiBaseUrl";

export interface CreateStripePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  /** From Stripe API — must match app publishable key mode (pk_live_ vs pk_test_). */
  livemode: boolean;
}

async function getDepositAccessToken(): Promise<string> {
  if (!supabase) {
    throw new Error("Sign in required to add funds.");
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error("Unable to read session. Please sign in again.");
  }

  const token = data.session?.access_token?.trim();
  if (!token) {
    throw new Error("Sign in required to add funds.");
  }

  return token;
}

export async function createStripePaymentIntent(
  amountUsd: number,
): Promise<CreateStripePaymentIntentResult> {
  const accessToken = await getDepositAccessToken();

  const response = await fetch(apiUrl("/api/stripe/create-payment-intent"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ amount_usd: amountUsd }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        client_secret?: string;
        payment_intent_id?: string;
        livemode?: boolean;
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to start payment.");
  }

  const clientSecret = payload?.client_secret?.trim();
  const paymentIntentId = payload?.payment_intent_id?.trim();

  if (!clientSecret || !paymentIntentId) {
    throw new Error("Payment could not be started. Please try again.");
  }

  const livemode = payload?.livemode === true;

  return { clientSecret, paymentIntentId, livemode };
}

export interface PaymentIntentDepositStatus {
  status: string;
  succeeded: boolean;
  pending: boolean;
}

export async function fetchPaymentIntentDepositStatus(
  paymentIntentId: string,
): Promise<PaymentIntentDepositStatus> {
  const accessToken = await getDepositAccessToken();

  const response = await fetch(apiUrl("/api/stripe/payment-intent-status"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ payment_intent_id: paymentIntentId }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        status?: string;
        succeeded?: boolean;
        pending?: boolean;
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Could not verify payment status.");
  }

  return {
    status: payload?.status?.trim() ?? "unknown",
    succeeded: payload?.succeeded === true,
    pending: payload?.pending === true,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll Stripe (via our API) until the deposit PaymentIntent succeeds or definitively fails.
 * Handles Apple Pay / 3DS races where the native sheet resolves before the PI settles.
 */
export async function waitForDepositPaymentSuccess(
  paymentIntentId: string,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<boolean> {
  const maxAttempts = options?.maxAttempts ?? 12;
  const intervalMs = options?.intervalMs ?? 800;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await fetchPaymentIntentDepositStatus(paymentIntentId);

    if (result.succeeded) {
      console.info("[Stripe] PaymentIntent verified on server", {
        paymentIntentId,
        status: result.status,
        attempt,
      });
      return true;
    }

    const failed =
      result.status === "requires_payment_method" || result.status === "canceled";
    if (failed) {
      console.warn("[Stripe] PaymentIntent failed on server", {
        paymentIntentId,
        status: result.status,
        attempt,
      });
      return false;
    }

    if (attempt < maxAttempts) {
      await sleep(intervalMs);
    }
  }

  console.warn("[Stripe] PaymentIntent status poll timed out", { paymentIntentId });
  return false;
}
