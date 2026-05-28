export type CryptoAsset = "SOL" | "BTC" | "ETH";

export type PaymentMethod = "card" | "crypto";

export interface PurchaseBundle {
  id: string;
  name: string;
  priceUsd: number;
  goldVolts: number;
  bonusGems: number;
  maxValue?: boolean;
}

/** Total gems credited on purchase. */
export function bundleTotalGems(bundle: PurchaseBundle): number {
  return bundle.goldVolts + bundle.bonusGems;
}

/** Boxed.gg-style gem refill tiers — exact list prices. */
export const PURCHASE_BUNDLES: PurchaseBundle[] = [
  {
    id: "refill-2500",
    name: "$24.98",
    priceUsd: 24.98,
    goldVolts: 2_500,
    bonusGems: 0,
  },
  {
    id: "refill-5000",
    name: "$49.98",
    priceUsd: 49.98,
    goldVolts: 5_000,
    bonusGems: 0,
  },
  {
    id: "refill-10000",
    name: "$99.98",
    priceUsd: 99.98,
    goldVolts: 10_000,
    bonusGems: 0,
  },
  {
    id: "refill-25000",
    name: "$249.98",
    priceUsd: 249.98,
    goldVolts: 25_000,
    bonusGems: 0,
  },
  {
    id: "refill-50000",
    name: "$499.98",
    priceUsd: 499.98,
    goldVolts: 50_000,
    bonusGems: 0,
  },
  {
    id: "refill-100000",
    name: "$999.98",
    priceUsd: 999.98,
    goldVolts: 100_000,
    bonusGems: 0,
  },
];

export const CRYPTO_WALLETS: Record<CryptoAsset, string> = {
  SOL: "7xKp9mN2vR4sT8wQ1yH6jL3fB5cD0eA9uG2hK",
  BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  ETH: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
};

/** $1 = 100 gems */
export const GEMS_PER_USD = 100;

export const CUSTOM_GEM_MIN = 500;

export const CUSTOM_GEM_MAX = 100_000;

export function customAmountBundle(gems: number): PurchaseBundle {
  return {
    id: `custom-${gems}`,
    name: "Custom amount",
    priceUsd: gems / GEMS_PER_USD,
    goldVolts: gems,
    bonusGems: 0,
  };
}
