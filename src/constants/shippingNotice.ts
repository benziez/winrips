export const SHIPPING_NOTICE_STORAGE_KEY = "winrips_shipping_notice_seen";

export function isShippingNoticeSeen(): boolean {
  try {
    return localStorage.getItem(SHIPPING_NOTICE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function persistShippingNoticeSeen(): void {
  try {
    localStorage.setItem(SHIPPING_NOTICE_STORAGE_KEY, "true");
  } catch {
    /* storage unavailable */
  }
}
