import { useApp } from "../../context/AppContext";
import { currencyLabel } from "../../constants/dualCurrency";
import { balanceForCurrency } from "../../utils/dualCurrency";
import { CurrencyTokenIcon } from "./CurrencyTokenIcon";

export function WalletButton() {
  const {
    goldVolts,
    sweepsCash,
    activeCurrency,
    gemBalanceLoading,
    openWalletModal,
  } = useApp();

  const activeBalance = balanceForCurrency(goldVolts, sweepsCash, activeCurrency);

  return (
    <button
      type="button"
      onClick={() => openWalletModal("overview")}
      className="flex h-10 max-w-full items-center gap-2 overflow-hidden rounded-md border border-border bg-slate px-3 transition-colors hover:border-fuchsia/40"
      aria-label="Open wallet"
    >
      <CurrencyTokenIcon currency={activeCurrency} size={20} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
        {currencyLabel(activeCurrency)}
      </span>
      <span
        className="truncate text-sm font-bold tabular-nums text-white"
        aria-busy={gemBalanceLoading && activeCurrency === "gold-volts"}
      >
        {gemBalanceLoading && activeCurrency === "gold-volts"
          ? "…"
          : activeBalance.toLocaleString()}
      </span>
    </button>
  );
}
