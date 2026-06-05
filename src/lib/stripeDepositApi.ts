import { supabase } from "./supabaseClient";
import { STRIPE_API_ROUTES } from "../constants/stripeApiRoutes";
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

  const response = await fetch(apiUrl(STRIPE_API_ROUTES.createPaymentIntent), {
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
    if (response.status === 404) {
      throw new Error(
        `Payment API not found (${STRIPE_API_ROUTES.createPaymentIntent}). Deploy the latest server or check VITE_API_BASE_URL.`,
      );
    }
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

type PaymentIntentStatusPollResponse =
  | { kind: "ok"; status: PaymentIntentDepositStatus }
  | { kind: "not_found" }
  | { kind: "error"; httpStatus: number; message: string };

const INITIAL_POLL_DELAY_MS = 1_500;
const POLL_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 800;

async function pollPaymentIntentDepositStatus(
  paymentIntentId: string,
): Promise<PaymentIntentStatusPollResponse> {
  const accessToken = await getDepositAccessToken();

  const response = await fetch(apiUrl(STRIPE_API_ROUTES.paymentIntentStatus), {
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

  if (response.status === 404) {
    const apiNotFound = payload?.error === "Not found";
    if (apiNotFound) {
      return {
        kind: "error",
        httpStatus: 404,
        message: `Payment status API not found (${STRIPE_API_ROUTES.paymentIntentStatus}).`,
      };
    }
    return { kind: "not_found" };
  }

  if (!response.ok) {
    return {
      kind: "error",
      httpStatus: response.status,
      message: payload?.error ?? "Could not verify payment status.",
    };
  }

  return {
    kind: "ok",
    status: {
      status: payload?.status?.trim() ?? "unknown",
      succeeded: payload?.succeeded === true,
      pending: payload?.pending === true,
    },
  };
}

export async function fetchPaymentIntentDepositStatus(
  paymentIntentId: string,
): Promise<PaymentIntentDepositStatus> {
  const result = await pollPaymentIntentDepositStatus(paymentIntentId);
  if (result.kind === "ok") return result.status;
  if (result.kind === "not_found") {
    throw new Error("Payment not found");
  }
  throw new Error(result.message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface WaitForDepositPaymentResult {
  confirmed: boolean;
  /** Set when polling ends with only retriable 404s (PI not visible yet). */
  notFoundAfterTimeout?: boolean;
}

/**
 * Poll Stripe (via our API) until the deposit PaymentIntent succeeds or definitively fails.
 * Handles Apple Pay / 3DS races where the native sheet resolves before the PI settles.
 */
export async function waitForDepositPaymentSuccess(
  paymentIntentId: string,
  options?: {
    initialDelayMs?: number;
    timeoutMs?: number;
    intervalMs?: number;
  },
): Promise<WaitForDepositPaymentResult> {
  const initialDelayMs = options?.initialDelayMs ?? INITIAL_POLL_DELAY_MS;
  const timeoutMs = options?.timeoutMs ?? POLL_TIMEOUT_MS;
  const intervalMs = options?.intervalMs ?? POLL_INTERVAL_MS;

  await sleep(initialDelayMs);

  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  let sawDefinitiveFailure = false;
  let lastObservedStatus: string | null = null;
  let onlyNotFound = true;

  while (Date.now() < deadline) {
    attempt += 1;
    const poll = await pollPaymentIntentDepositStatus(paymentIntentId);

    if (poll.kind === "ok") {
      onlyNotFound = false;
      lastObservedStatus = poll.status.status;

      if (poll.status.succeeded) {
        console.info("[Stripe] PaymentIntent verified on server", {
          paymentIntentId,
          status: poll.status.status,
          attempt,
        });
        return { confirmed: true };
      }

      const failed =
        poll.status.status === "requires_payment_method" ||
        poll.status.status === "canceled";
      if (failed) {
        console.warn("[Stripe] PaymentIntent failed on server", {
          paymentIntentId,
          status: poll.status.status,
          attempt,
        });
        sawDefinitiveFailure = true;
        return { confirmed: false };
      }
    } else if (poll.kind === "not_found") {
      console.info("[Stripe] PaymentIntent not found yet (retriable 404)", {
        paymentIntentId,
        attempt,
      });
    } else {
      onlyNotFound = false;
      console.warn("[Stripe] PaymentIntent status poll error (retriable)", {
        paymentIntentId,
        attempt,
        httpStatus: poll.httpStatus,
        message: poll.message,
      });
    }

    if (Date.now() + intervalMs >= deadline) {
      break;
    }
    await sleep(intervalMs);
  }

  if (onlyNotFound) {
    console.warn("[Stripe] PaymentIntent still not found after poll timeout", {
      paymentIntentId,
      attempt,
    });
    return { confirmed: false, notFoundAfterTimeout: true };
  }

  console.warn("[Stripe] PaymentIntent status poll timed out", {
    paymentIntentId,
    attempt,
    lastObservedStatus,
    sawDefinitiveFailure,
  });
  return { confirmed: false };
}
