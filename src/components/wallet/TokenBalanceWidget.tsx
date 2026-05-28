import { useEffect } from "react";
import { GemIcon } from "../icons/AppIcons";
import { useApp } from "../../context/AppContext";
import { formatGemBalanceDisplay } from "../../constants/retail";

export function TokenBalanceWidget() {
  const {
    goldVolts,
    gemBalanceLoading,
    userId,
    syncGemBalanceFromServer,
    setPurchaseModalOpen,
    setDepositModalOpen,
  } = useApp();

  useEffect(() => {
    if (!userId) return;
    void syncGemBalanceFromServer(userId);
  }, [userId, syncGemBalanceFromServer]);

  return (
    <div className="flex h-9 max-w-full items-stretch overflow-hidden rounded-md border border-border bg-slate sm:h-10">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-2 pr-1 sm:gap-0 sm:pl-0">
        <GemIcon size={14} className="shrink-0 text-gold md:hidden" aria-hidden />
        <span className="hidden shrink-0 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted md:inline">
          Credits
        </span>
        <span
          className="truncate text-xs font-bold tabular-nums text-white sm:pr-3 sm:text-sm"
          aria-busy={gemBalanceLoading}
          aria-live="polite"
        >
          {gemBalanceLoading ? "…" : formatGemBalanceDisplay(goldVolts)}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDepositModalOpen(true)}
        className="hidden h-full shrink-0 items-center justify-center border-l border-border bg-slate-elevated px-3 text-[10px] font-bold uppercase tracking-wider text-muted transition-colors duration-200 hover:text-white md:flex"
        aria-label="Deposit with crypto"
      >
        Crypto
      </button>
      <button
        type="button"
        onClick={() => setPurchaseModalOpen(true)}
        className="flex h-full shrink-0 items-center justify-center bg-fuchsia px-3 text-sm font-extrabold text-white transition-all duration-200 hover:brightness-110 sm:px-4"
        aria-label="Purchase Credits"
      >
        +
      </button>
    </div>
  );
}
