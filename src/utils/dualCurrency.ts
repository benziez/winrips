import type { Currency } from "../types";

export function balanceForCurrency(
  gems: number,
  rips: number,
  active: Currency,
): number {
  return active === "gold-volts" ? gems : rips;
}

export function isGemsCurrency(currency: Currency): boolean {
  return currency === "gold-volts";
}
