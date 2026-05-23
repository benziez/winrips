import { useEffect, useRef, useState } from "react";
import type { Currency } from "../../types";
import { useApp } from "../../context/AppContext";
import { GEMS_LABEL, RIPS_LABEL } from "../../constants/dualCurrency";
import { formatGemBalanceDisplay } from "../../constants/retail";
import { balanceForCurrency } from "../../utils/dualCurrency";
import { ChevronDown } from "../icons/AppIcons";
import { CurrencyTokenIcon } from "./CurrencyTokenIcon";

const CURRENCY_OPTIONS: { id: Currency; label: string }[] = [
  { id: "gold-volts", label: GEMS_LABEL },
  { id: "sweeps-cash", label: RIPS_LABEL },
];

export function HeaderWalletControls({ compact = false }: { compact?: boolean }) {
  const {
    isLoggedIn,
    goldVolts,
    sweepsCash,
    activeCurrency,
    setActiveCurrency,
    gemBalanceLoading,
    syncGemBalanceFromServer,
    userId,
    openWalletModal,
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeBalance = balanceForCurrency(goldVolts, sweepsCash, activeCurrency);
  const activeLabel = CURRENCY_OPTIONS.find((c) => c.id === activeCurrency)?.label ?? GEMS_LABEL;

  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    void syncGemBalanceFromServer(userId);
  }, [isLoggedIn, userId, syncGemBalanceFromServer]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  const balanceLabel = formatGemBalanceDisplay(activeBalance, compact);

  return (
    <div className={`flex flex-nowrap items-center ${compact ? "gap-1" : "gap-2"}`}>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className={`flex h-9 w-auto min-w-[70px] flex-nowrap items-center rounded-md border border-border bg-slate px-2 transition-colors hover:border-fuchsia/30 sm:h-10 ${
            compact ? "gap-0.5" : "gap-1.5 sm:gap-2"
          }`}
          aria-expanded={menuOpen}
          aria-haspopup="listbox"
          aria-label={`${activeLabel} balance, ${activeBalance.toLocaleString()}`}
        >
          <CurrencyTokenIcon currency={activeCurrency} size={compact ? 18 : 22} />
          <span
            className={`whitespace-nowrap font-bold tabular-nums text-white ${
              compact ? "text-[11px]" : "text-xs sm:text-sm"
            }`}
            aria-busy={gemBalanceLoading && activeCurrency === "gold-volts"}
            aria-live="polite"
          >
            {gemBalanceLoading && activeCurrency === "gold-volts" ? "…" : balanceLabel}
          </span>
          {compact ? null : (
            <ChevronDown
              size={14}
              className={`shrink-0 text-muted transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {menuOpen ? (
          <ul
            role="listbox"
            className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[168px] overflow-hidden rounded-lg border border-border bg-[#1a2c38] py-1 shadow-xl"
          >
            {CURRENCY_OPTIONS.map((option) => {
              const balance = balanceForCurrency(goldVolts, sweepsCash, option.id);
              const selected = activeCurrency === option.id;

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setActiveCurrency(option.id);
                      setMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? "bg-fuchsia/10 text-white"
                        : "text-muted hover:bg-slate-elevated hover:text-white"
                    }`}
                  >
                    <CurrencyTokenIcon currency={option.id} size={20} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                        {option.label}
                      </span>
                      <span className="block text-sm font-bold tabular-nums text-white">
                        {balance.toLocaleString()}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => openWalletModal("overview")}
        aria-label="Open wallet"
        className={`flex shrink-0 items-center justify-center rounded-md bg-[#ff007a] font-bold text-white shadow-[0_0_16px_rgba(255,0,122,0.35)] transition-all hover:brightness-110 sm:h-10 ${
          compact
            ? "h-9 w-9 text-base leading-none"
            : "h-9 px-3 text-[10px] uppercase tracking-wider sm:px-4 sm:text-xs"
        }`}
      >
        {compact ? "+" : "Wallet"}
      </button>
    </div>
  );
}
