import { isAppStoreCommerce } from "../constants/commerce";

/** True when gem-denominated toasts should not render on the native shell. */
export function shouldSuppressMobileGemToast(message: string): boolean {
  if (!isAppStoreCommerce()) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("gems have been credited") ||
    normalized.includes("exchange complete") ||
    (normalized.includes("gems") && normalized.includes("credited"))
  );
}
