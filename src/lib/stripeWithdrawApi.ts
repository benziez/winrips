import { STRIPE_API_ROUTES } from "../constants/stripeApiRoutes";
import { supabase } from "./supabaseClient";
import { apiUrl } from "../utils/apiBaseUrl";

export interface StripeConnectStatus {
  stripeConnectAccountId: string | null;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  withdrawableBalanceGems: number;
  weeklyWithdrawnCents: number;
  weeklyRemainingCents: number;
  kycVerified: boolean;
  kycVerificationSessionId: string | null;
  totalWithdrawnYtdCents: number;
  taxInfoCollected: boolean;
}

async function getWithdrawAccessToken(): Promise<string> {
  if (!supabase) {
    throw new Error("Sign in required to withdraw.");
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error("Unable to read session. Please sign in again.");
  }

  const token = data.session?.access_token?.trim();
  if (!token) {
    throw new Error("Sign in required to withdraw.");
  }

  return token;
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const accessToken = await getWithdrawAccessToken();
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
}

function parseConnectStatus(payload: Record<string, unknown>): StripeConnectStatus {
  return {
    stripeConnectAccountId:
      typeof payload.stripe_connect_account_id === "string"
        ? payload.stripe_connect_account_id
        : null,
    payoutsEnabled: Boolean(payload.payouts_enabled),
    detailsSubmitted: Boolean(payload.details_submitted),
    withdrawableBalanceGems: Math.max(
      0,
      Math.round(Number(payload.withdrawable_balance_gems) || 0),
    ),
    weeklyWithdrawnCents: Math.max(0, Math.round(Number(payload.weekly_withdrawn_cents) || 0)),
    weeklyRemainingCents: Math.max(0, Math.round(Number(payload.weekly_remaining_cents) || 0)),
    kycVerified: Boolean(payload.kyc_verified),
    kycVerificationSessionId:
      typeof payload.kyc_verification_session_id === "string"
        ? payload.kyc_verification_session_id
        : null,
    totalWithdrawnYtdCents: Math.max(
      0,
      Math.round(Number(payload.total_withdrawn_ytd_cents) || 0),
    ),
    taxInfoCollected: Boolean(payload.tax_info_collected),
  };
}

export async function fetchStripeConnectStatus(): Promise<StripeConnectStatus> {
  const response = await authedFetch(STRIPE_API_ROUTES.connectStatus, { method: "GET" });
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to load withdrawal status.");
  }

  return parseConnectStatus(payload ?? {});
}

export async function createStripeConnectAccount(): Promise<string> {
  const response = await authedFetch(STRIPE_API_ROUTES.connectAccount, { method: "POST" });
  const payload = (await response.json().catch(() => null)) as
    | { account_id?: string; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to set up withdrawals.");
  }

  const accountId = payload?.account_id?.trim();
  if (!accountId) {
    throw new Error("Withdrawal setup failed. Please try again.");
  }

  return accountId;
}

export async function createStripeOnboardingLink(): Promise<string> {
  const response = await authedFetch(STRIPE_API_ROUTES.onboardingLink, { method: "POST" });
  const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to open bank setup.");
  }

  const url = payload?.url?.trim();
  if (!url) {
    throw new Error("Bank setup could not be started. Please try again.");
  }

  return url;
}

export async function submitStripeWithdrawal(amountUsd: number): Promise<void> {
  const response = await authedFetch(STRIPE_API_ROUTES.withdraw, {
    method: "POST",
    body: JSON.stringify({ amount_usd: amountUsd }),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Withdrawal failed. Please try again.");
  }
}

export interface KycSessionResult {
  alreadyVerified: boolean;
  url: string | null;
  sessionId: string | null;
}

export async function createStripeKycSession(): Promise<KycSessionResult> {
  const response = await authedFetch(STRIPE_API_ROUTES.kycSession, { method: "POST" });
  const payload = (await response.json().catch(() => null)) as
    | {
        url?: string;
        session_id?: string;
        already_verified?: boolean;
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to start identity verification.");
  }

  if (payload?.already_verified) {
    return { alreadyVerified: true, url: null, sessionId: null };
  }

  const url = payload?.url?.trim();
  if (!url) {
    throw new Error("Verification could not be started. Please try again.");
  }

  return {
    alreadyVerified: false,
    url,
    sessionId: typeof payload?.session_id === "string" ? payload.session_id : null,
  };
}
