import type { Currency } from "../types";

export const GEMS_LABEL = "Gems";
export const RIPS_LABEL = "Rips";
export const GEMS_FULL_NAME = "WinRips Gems";
export const RIPS_FULL_NAME = "Sweep Cash / Rips";

/** @deprecated use GEMS_LABEL */
export const CREDITS_LABEL = GEMS_LABEL;
/** @deprecated use RIPS_LABEL */
export const VAULT_CASH_LABEL = RIPS_LABEL;
/** @deprecated use GEMS_FULL_NAME */
export const CREDITS_FULL_NAME = GEMS_FULL_NAME;
/** @deprecated use RIPS_FULL_NAME */
export const VAULT_CASH_FULL_NAME = RIPS_FULL_NAME;

export const DAILY_BONUS_GEMS = 100;
export const DAILY_BONUS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const DAILY_CLAIM_STORAGE_KEY = "winrips_daily_claim_at";
export const ACTIVE_CURRENCY_STORAGE_KEY = "winrips_active_currency";
export const STARTER_GEMS_CLAIM_KEY = "winrips_starter_gems_claimed";
export const STARTER_GEMS_GRANT = 1_000;
export const LOW_GEMS_THRESHOLD = 10;

export function currencyLabel(currency: Currency): string {
  return currency === "gold-volts" ? GEMS_LABEL : RIPS_LABEL;
}

export function currencyFullName(currency: Currency): string {
  return currency === "gold-volts" ? GEMS_FULL_NAME : RIPS_FULL_NAME;
}

export function readPersistedActiveCurrency(): Currency {
  try {
    const raw = localStorage.getItem(ACTIVE_CURRENCY_STORAGE_KEY);
    if (raw === "gold-volts" || raw === "sweeps-cash") return raw;
  } catch {
    /* ignore */
  }
  return "gold-volts";
}

export function persistActiveCurrency(currency: Currency): void {
  try {
    localStorage.setItem(ACTIVE_CURRENCY_STORAGE_KEY, currency);
  } catch {
    /* ignore */
  }
}
