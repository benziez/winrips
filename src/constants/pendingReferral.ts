const PENDING_REFERRAL_KEY = "winrips_pending_referral_code";

export function captureReferralFromLocation(search: string): void {
  if (typeof window === "undefined") return;

  const ref = new URLSearchParams(search).get("ref");
  const normalized = ref?.trim().toUpperCase();
  if (!normalized) return;

  try {
    localStorage.setItem(PENDING_REFERRAL_KEY, normalized);
  } catch {
    /* ignore quota / private mode */
  }
}

export function readPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(PENDING_REFERRAL_KEY)?.trim().toUpperCase();
    return stored || null;
  } catch {
    return null;
  }
}

export function clearPendingReferralCode(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(PENDING_REFERRAL_KEY);
  } catch {
    /* ignore */
  }
}
