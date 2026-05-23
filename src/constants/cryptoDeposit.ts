import type { DepositPayCurrency } from "../types/payments";
import { GEMS_PER_USD } from "../data/purchaseBundles";

export interface CryptoDepositOption {
  id: DepositPayCurrency;
  ticker: string;
  network: string;
}

/** Active NOWPayments payout wallets — maps 1:1 to `pay_currency`. */
export const CRYPTO_DEPOSIT_OPTIONS: CryptoDepositOption[] = [
  { id: "btc", ticker: "BTC", network: "Bitcoin" },
  { id: "sol", ticker: "SOL", network: "Solana" },
  { id: "ltc", ticker: "LTC", network: "Litecoin" },
];

export const MIN_CRYPTO_DEPOSIT_USD = 1;

export function gemsFromUsd(usd: number): number {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.round(usd * GEMS_PER_USD);
}

/** 100% Rips match on every deposit (same as gems credited). */
export function ripsFromUsd(usd: number): number {
  return gemsFromUsd(usd);
}

export function findCryptoOption(id: DepositPayCurrency): CryptoDepositOption {
  return CRYPTO_DEPOSIT_OPTIONS.find((o) => o.id === id) ?? CRYPTO_DEPOSIT_OPTIONS[0]!;
}
