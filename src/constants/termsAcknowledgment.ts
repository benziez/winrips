export const TERMS_ACCEPTED_STORAGE_KEY = "winrips_terms_accepted";
export const GUEST_BROWSE_STORAGE_KEY = "winrips_guest_browse";
export const MARKETING_OPT_IN_STORAGE_KEY = "winrips_marketing_opt_in";

export function isTermsAccepted(): boolean {
  try {
    return localStorage.getItem(TERMS_ACCEPTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function persistTermsAccepted(marketingOptIn: boolean): void {
  try {
    localStorage.setItem(TERMS_ACCEPTED_STORAGE_KEY, "true");
    if (marketingOptIn) {
      localStorage.setItem(MARKETING_OPT_IN_STORAGE_KEY, "true");
    }
  } catch {
    /* storage unavailable */
  }
}

export function isGuestBrowseEnabled(): boolean {
  try {
    return localStorage.getItem(GUEST_BROWSE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function persistGuestBrowse(): void {
  try {
    localStorage.setItem(GUEST_BROWSE_STORAGE_KEY, "true");
  } catch {
    /* storage unavailable */
  }
}
