/** VIP developer / partner gate password for alpha access. */
export const VIP_ACCESS_PASSWORD = "monster2026";

export const VIP_ACCESS_STORAGE_KEY = "winrips-vip-access";

const LEGACY_VIP_ACCESS_STORAGE_KEY = "monster-drops-vip-access";

export function readVipAccessFromStorage(): boolean {
  try {
    if (localStorage.getItem(VIP_ACCESS_STORAGE_KEY) === "1") return true;
    if (localStorage.getItem(LEGACY_VIP_ACCESS_STORAGE_KEY) === "1") {
      persistVipAccess();
      localStorage.removeItem(LEGACY_VIP_ACCESS_STORAGE_KEY);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function persistVipAccess(): void {
  try {
    localStorage.setItem(VIP_ACCESS_STORAGE_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}
