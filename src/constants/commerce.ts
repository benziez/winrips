import { isNativeCapacitorApp } from "../utils/platform";

/** Native iOS/Android uses App Store IAP (RevenueCat), not gem refill UI. */
export function isAppStoreCommerce(): boolean {
  return isNativeCapacitorApp();
}

export const COMMERCE_COPY = {
  unlockVerb: "Unlock Drop",
  payWithApple: "Pay with Apple Pay",
  whatsInside: "What's inside",
  catalogTitle: "Mystery Drops",
  catalogSubtitle: "Premium sealed packs · tap to rip",
} as const;
