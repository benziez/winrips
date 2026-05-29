const MANUAL_RIP_KEY = "winrips.manualRip";
const FAST_MODE_KEY = "winrips.fastMode";

export function isManualRipEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MANUAL_RIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function setManualRipEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MANUAL_RIP_KEY, enabled ? "1" : "0");
  } catch {
    /* quota / private mode */
  }
}

/** Fast Mode — quick spin, full reveal. Persists across opens and sessions. */
export function isFastModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FAST_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setFastModeEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAST_MODE_KEY, enabled ? "1" : "0");
  } catch {
    /* quota / private mode */
  }
}
