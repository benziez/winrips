import { UNDERAGE_ERROR } from "../utils/ageVerification";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { logger } from "./logger";

export interface ComplianceProfile {
  isAgeVerified: boolean;
  kycVerified: boolean;
  kycVerificationSessionId: string | null;
  totalWithdrawnYtdCents: number;
  taxInfoCollected: boolean;
}

export const TAX_THRESHOLD_CENTS = 60_000;

export async function fetchComplianceProfile(
  authUserId: string,
): Promise<ComplianceProfile | null> {
  if (!isSupabaseConfigured() || !supabase || !authUserId.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "is_age_verified, kyc_verified, kyc_verification_session_id, total_withdrawn_ytd, tax_info_collected",
    )
    .eq("id", authUserId.trim())
    .maybeSingle();

  if (error) {
    logger.warn("[compliance] profile fetch failed:", error.message);
    return null;
  }

  if (!data) return null;

  const row = data as {
    is_age_verified?: boolean | null;
    kyc_verified?: boolean | null;
    kyc_verification_session_id?: string | null;
    total_withdrawn_ytd?: number | null;
    tax_info_collected?: boolean | null;
  };

  return {
    isAgeVerified: row.is_age_verified === true,
    kycVerified: row.kyc_verified === true,
    kycVerificationSessionId:
      typeof row.kyc_verification_session_id === "string"
        ? row.kyc_verification_session_id.trim() || null
        : null,
    totalWithdrawnYtdCents: Math.max(0, Math.round(Number(row.total_withdrawn_ytd) || 0)),
    taxInfoCollected: row.tax_info_collected === true,
  };
}

export async function setAgeVerification(dateOfBirth: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: "Authentication is not configured." };
  }

  const { data, error } = await supabase.rpc("set_age_verification", {
    p_date_of_birth: dateOfBirth,
  } as never);

  if (error) {
    return { error: error.message };
  }

  const result = data as { success?: boolean; error?: string } | null;
  if (!result?.success) {
    if (result?.error === "underage") {
      return { error: UNDERAGE_ERROR };
    }
    return { error: "Could not save date of birth. Please try again." };
  }

  return { error: null };
}

export async function submitTaxInfo(params: {
  taxName: string;
  taxAddress: string;
  taxSsnLast4: string;
}): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: "Authentication is not configured." };
  }

  const { data, error } = await supabase.rpc("submit_tax_info", {
    p_tax_name: params.taxName.trim(),
    p_tax_address: params.taxAddress.trim(),
    p_tax_ssn_last4: params.taxSsnLast4.trim(),
  } as never);

  if (error) {
    return { error: error.message };
  }

  const result = data as { success?: boolean; error?: string } | null;
  if (!result?.success) {
    return { error: "Could not save tax information. Check your entries and try again." };
  }

  return { error: null };
}
