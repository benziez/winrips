const MANUAL_RIP_KEY = "winrips.manualRip";

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
