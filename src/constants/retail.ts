/**
 * WINRIPS — mandated retail terminology (e-commerce, not gambling).
 * @see Production architectural blueprint
 */
export const RETAIL_COPY = {
  brand: "WinRips",
  tagline: "Premium TCG & Sports Unboxing",
  currency: "balance",
  currencyAbbr: "balance",
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

/** User-facing currency display (100 internal units = $1). */
export function formatGems(amount: number): string {
  return formatUsd(gemsToUsd(amount));
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

/** Balance pill display — compact uses shorthand (e.g. $1.0M) on narrow header layouts. */
export function formatGemBalanceDisplay(balance: number, compact = false): string {
  const usd = gemsToUsd(balance);
  if (compact && usd >= 1_000_000) {
    return `$${(usd / 1_000_000).toFixed(1)}M`;
  }
  return formatUsd(usd);
}

/** Buyback credit rate for exchange and auto-sell actions. */
export const EXCHANGE_CREDIT_RATE = 0.85;

/** Cards below this USD value can only auto-sell, not ship. */
export const SHIP_MIN_VALUE_USD = 50;

/** 85% buyback credit for exchange actions. */
export function exchangeCreditGems(itemValueGems: number): number {
  return Math.floor(itemValueGems * EXCHANGE_CREDIT_RATE);
}

/** Whether a vaulted card meets the minimum USD value for physical shipping. */
export function canShipCardValue(itemValueGems: number): boolean {
  return gemsToUsd(itemValueGems) >= SHIP_MIN_VALUE_USD;
}

/** e.g. EXCHANGE FOR $0.27 (85% CREDIT) */
export function exchangeButtonLabel(itemValueGems: number): string {
  const credit = exchangeCreditGems(itemValueGems);
  return `EXCHANGE FOR ${formatUsd(gemsToUsd(credit))} (85% CREDIT)`;
}

/** e.g. EXCHANGE FOR $0.27 (85% CREDIT) — display only; settlement stays gem-denominated */
export function exchangeButtonLabelUsd(itemValueGems: number): string {
  const credit = exchangeCreditGems(itemValueGems);
  return `EXCHANGE FOR ${formatUsd(gemsToUsd(credit))} (85% CREDIT)`;
}

export const SHIP_BUTTON_LABEL = "REQUEST PHYSICAL SHIPPING";
