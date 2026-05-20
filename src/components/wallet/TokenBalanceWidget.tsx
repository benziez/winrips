import { useEffect } from "react";
import { useApp } from "../../context/AppContext";

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
    void syncGemBalanceFromServer();
  }, [userId, syncGemBalanceFromServer]);

  return (
    <div className="flex h-10 max-w-full items-stretch overflow-hidden rounded-md border border-[#2A2D34] bg-[#1A1C20]">
      <div className="flex min-w-0 flex-1 items-center">
        <span className="shrink-0 px-3 text-xs font-semibold uppercase tracking-wider text-[#A0A5B5]">
          GEMS
        </span>
        <span
          className="truncate pr-3 text-sm font-bold tabular-nums text-white"
          aria-busy={gemBalanceLoading}
          aria-live="polite"
        >
          {gemBalanceLoading ? "…" : goldVolts.toLocaleString()}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDepositModalOpen(true)}
        className="flex h-full shrink-0 items-center justify-center border-l border-[#2A2D34] bg-[#16181C] px-3 text-[10px] font-bold uppercase tracking-wider text-[#A0A5B5] transition-colors hover:bg-[#1A1C20] hover:text-[#FF007F]"
        aria-label="Deposit with crypto"
      >
        Crypto
      </button>
      <button
        type="button"
        onClick={() => setPurchaseModalOpen(true)}
        className="flex h-full shrink-0 items-center justify-center bg-[#FF007F] px-4 text-base font-extrabold text-white transition-colors hover:bg-[#FF007F]/90"
        aria-label="Purchase Gems"
      >
        +
      </button>
    </div>
  );
}