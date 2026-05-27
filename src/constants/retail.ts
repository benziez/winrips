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

/** Convert gem cost to USD list price (100 gems = $1). */
export function gemsToUsd(gemCost: number): number {
  const safe = Number.isFinite(gemCost) && gemCost > 0 ? gemCost : 0;
  return safe / RETAIL_COPY.gemsPerUsd;
}

export function formatUsd(amount: number): string {
  const safe = Number.isFinite(amount) && amount >= 0 ? amount : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: safe % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

/** App Store / catalog price label for a pack gem cost. */
export function formatPackPriceUsd(gemCost: number): string {
  return formatUsd(gemsToUsd(gemCost));
}

/** Gem pill display — compact uses shorthand (e.g. 1.0M) on narrow header layouts. */
export function formatGemBalanceDisplay(balance: number, compact = false): string {
  const safe = Number.isFinite(balance) && balance >= 0 ? balance : 0;
  if (compact && safe >= 1_000_000) {
    return `${(safe / 1_000_000).toFixed(1)}M`;
  }
  return safe.toLocaleString();
}

/** 65% buyback credit for exchange actions. */
export function exchangeCreditGems(itemValueGems: number): number {
  return Math.floor(itemValueGems * 0.65);
}

/** e.g. EXCHANGE FOR 27 GEMS (65% CREDIT) */
export function exchangeButtonLabel(itemValueGems: number): string {
  const credit = exchangeCreditGems(itemValueGems);
  return `EXCHANGE FOR ${credit.toLocaleString()} GEMS (65% CREDIT)`;
}

export const SHIP_BUTTON_LABEL = "REQUEST PHYSICAL SHIPPING";
