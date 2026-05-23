export const AGE_VERIFIED_STORAGE_KEY = "winrips_age_verified";

export function isAgeVerified(): boolean {
  try {
    return localStorage.getItem(AGE_VERIFIED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function persistAgeVerified(): void {
  try {
    localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, "true");
  } catch {
    /* storage unavailable */
  }
}
