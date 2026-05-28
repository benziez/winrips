import { supabase } from "./supabaseClient";
import { apiUrl } from "../utils/apiBaseUrl";

export interface CreateStripePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
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
    | { client_secret?: string; payment_intent_id?: string; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to start payment.");
  }

  const clientSecret = payload?.client_secret?.trim();
  const paymentIntentId = payload?.payment_intent_id?.trim();

  if (!clientSecret || !paymentIntentId) {
    throw new Error("Payment could not be started. Please try again.");
  }

  return { clientSecret, paymentIntentId };
}
