import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { logger } from "./logger";
import { normalizeReferralCodeInput, referralCodeForUserId } from "../utils/referralCode";
import { clearPendingReferralCode, readPendingReferralCode } from "../constants/pendingReferral";

/** $5 signup bonus per party (100 gems = $1). */
export const REFERRAL_SIGNUP_BONUS_GEMS = 500;

export async function fetchProfileReferralCode(authUserId: string): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase || !authUserId.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", authUserId.trim())
    .single();

  if (error) {
    logger.warn("[referrals] profile referral_code fetch failed:", error.message);
    return referralCodeForUserId(authUserId);
  }

  const row = data as { referral_code?: string | null } | null;
  const code = typeof row?.referral_code === "string" ? row.referral_code.trim() : "";
  return code || referralCodeForUserId(authUserId);
}

/** Claim a pending referral after OAuth / Apple sign-in (email signup uses auth metadata). */
export async function claimPendingReferralIfNeeded(authUserId: string): Promise<void> {
  const pending = normalizeReferralCodeInput(readPendingReferralCode());
  if (!pending || !isSupabaseConfigured() || !supabase || !authUserId.trim()) {
    return;
  }

  const { error } = await supabase.rpc(
    "claim_referral_signup",
    {
      p_referral_code: pending,
    } as never,
  );

  if (error) {
    logger.warn("[referrals] claim_referral_signup failed:", error.message);
    return;
  }

  clearPendingReferralCode();
}
