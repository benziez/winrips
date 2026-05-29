/** Stable referral code derived from a user id (matches DB generate_referral_code). */
export function referralCodeForUserId(userId: string): string {
  const base = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return base.length >= 6 ? `WR-${base}` : "WR-GUEST";
}

export function normalizeReferralCodeInput(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim().toUpperCase() ?? "";
  if (!trimmed) return null;
  return trimmed.startsWith("WR-") ? trimmed : `WR-${trimmed}`;
}

export const REFERRAL_SIGNUP_BONUS_USD = 5;

export const REFERRAL_LANDING_URL = "https://winrips.com";

export function referralShareUrl(code: string): string {
  const normalized = normalizeReferralCodeInput(code) ?? code;
  return `${REFERRAL_LANDING_URL}/?ref=${encodeURIComponent(normalized)}`;
}
