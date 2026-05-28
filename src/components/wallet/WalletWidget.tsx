import { useRef, useState, useEffect } from "react";
import type { Currency } from "../../types";
import { useApp } from "../../context/AppContext";
import { formatGemBalanceDisplay } from "../../constants/retail";

const CURRENCIES: { id: Currency; label: string; accent: string }[] = [
  { id: "gold-volts", label: "Balance", accent: "text-[#00e701]" },
  { id: "sweeps-cash", label: "Sweeps Cash", accent: "text-white" },
];

export function WalletWidget() {
  const { goldVolts, sweepsCash, activeCurrency, setActiveCurrency, setPurchaseModalOpen } =
    useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = CURRENCIES.find((c) => c.id === activeCurrency) ?? CURRENCIES[0];
  const balance = activeCurrency === "gold-volts" ? goldVolts : sweepsCash;

  function formatCurrencyAmount(currency: Currency, amount: number): string {
    return currency === "gold-volts" ? formatGemBalanceDisplay(amount) : amount.toLocaleString();
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative flex items-center">
      <div className="flex items-center gap-1 rounded-xl border border-border bg-[#121318] pl-2 pr-1 py-1 sm:gap-1.5 sm:pl-3 sm:pr-1.5">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 sm:gap-3 min-w-0"
          aria-expanded={menuOpen}
          aria-haspopup="listbox"
        >
          <div className="text-left min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted sm:text-[10px]">
              {active.label}
            </p>
            <p
              className={`text-lg font-bold tabular-nums leading-tight sm:text-2xl ${active.accent}`}
            >
              {formatCurrencyAmount(activeCurrency, balance)}
            </p>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setPurchaseModalOpen(true)}
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF007F] text-xl font-bold text-white shadow-[0_0_16px_rgba(255,0,127,0.45)] transition-all hover:brightness-110 hover:scale-105"
          aria-label="Buy coins"
        >
          +
        </button>
      </div>

      {menuOpen && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-border bg-[#121318] py-1 shadow-xl overflow-hidden"
        >
          {CURRENCIES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected={activeCurrency === c.id}
                onClick={() => {
                  setActiveCurrency(c.id);
                  setMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  activeCurrency === c.id
                    ? "bg-fuchsia/10 text-fuchsia"
                    : "text-muted hover:bg-metallic hover:text-white"
                }`}
              >
                <span className="font-medium">{c.label}</span>
                <span className="ml-2 tabular-nums text-white">
                  {formatCurrencyAmount(c.id, c.id === "gold-volts" ? goldVolts : sweepsCash)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
