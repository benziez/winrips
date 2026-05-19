/**
 * WINRIPS — mandated retail terminology (e-commerce, not gambling).
 * @see Production architectural blueprint
 */
export const RETAIL_COPY = {
  brand: "WinRips",
  tagline: "Premium TCG & Sports Unboxing",
  currency: "Gems",
  currencyAbbr: "Gems",
  /** ~100 Gems = $1.00 USD */
  gemsPerUsd: 100,
  purchaseVerb: "Unlock Drop",
  pullNoun: "Pull",
  ceilingDrop: "Ceiling Drop",
  shipAction: "Request Physical Shipping",
  vaultEmpty: "Your storefront vault is empty",
  fairnessTitle: "Provably Fair Verification",
} as const;

/** Display label for mega-win banner (retail: ceiling drop, not jackpot). */
export function ceilingDropHeadline(estimatedValueGems: number): string {
  return estimatedValueGems >= 10_000 ? "CEILING DROP" : "PREMIUM PULL";
}

export function formatGems(amount: number): string {
  return `${amount.toLocaleString()} Gems`;
}

/** 90% buyback credit for exchange actions. */
export function exchangeCreditGems(itemValueGems: number): number {
  return Math.round(itemValueGems * 0.9);
}

/** e.g. EXCHANGE FOR 27 GEMS (90% CREDIT) */
export function exchangeButtonLabel(itemValueGems: number): string {
  const credit = exchangeCreditGems(itemValueGems);
  return `EXCHANGE FOR ${credit.toLocaleString()} GEMS (90% CREDIT)`;
}

export const SHIP_BUTTON_LABEL = "REQUEST PHYSICAL SHIPPING";
