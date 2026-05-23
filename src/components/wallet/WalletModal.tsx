import { useApp } from "../../context/AppContext";
import type { WalletModalTab } from "../../types/wallet";
import {
  GEMS_FULL_NAME,
  GEMS_LABEL,
  LOW_GEMS_THRESHOLD,
  RIPS_FULL_NAME,
  RIPS_LABEL,
  STARTER_GEMS_GRANT,
} from "../../constants/dualCurrency";
import { DailyBonusPanel } from "./DailyBonusPanel";
import { CurrencyTokenIcon } from "./CurrencyTokenIcon";
import { WalletOfferBanner } from "./WalletOfferBanner";

const TABS: { id: WalletModalTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "daily-bonus", label: "Daily Bonus" },
  { id: "top-up", label: "Top Up" },
];

export function WalletModal() {
  const {
    walletModalOpen,
    walletModalTab,
    closeWalletModal,
    openWalletModal,
    isLoggedIn,
    goldVolts,
    sweepsCash,
    gemBalanceLoading,
    openGemRefillFromWallet,
    navigateToView,
    claimStarterGems,
    showCashoutToast,
  } = useApp();

  if (!walletModalOpen || !isLoggedIn) return null;

  const canClaimStarter = goldVolts < LOW_GEMS_THRESHOLD;

  function handleRedeem() {
    closeWalletModal();
    navigateToView("rewards");
  }

  function handleBuyGems() {
    openGemRefillFromWallet();
  }

  function handleStarterClaim() {
    const granted = claimStarterGems();
    if (granted) {
      showCashoutToast(`Starter pack claimed: +${STARTER_GEMS_GRANT.toLocaleString()} ${GEMS_LABEL}.`);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      onClick={closeWalletModal}
    >
      <div
        className="flex max-h-[min(90vh,680px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-[#1a2c38] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border/80 px-5 py-4">
          <h2 id="wallet-modal-title" className="text-lg font-bold text-white">
            Wallet
          </h2>
          <button
            type="button"
            onClick={closeWalletModal}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:text-white"
            aria-label="Close wallet"
          >
            ×
          </button>
        </header>

        <nav className="flex gap-1 border-b border-border/80 px-3 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => openWalletModal(tab.id)}
              className={`flex-1 rounded-lg px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors sm:text-xs ${
                walletModalTab === tab.id
                  ? "bg-fuchsia/15 text-fuchsia"
                  : "text-muted hover:bg-slate-elevated/80 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <WalletOfferBanner />

          <div className="mt-4">
          {walletModalTab === "overview" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-gold/25 bg-[#0f212e]/80 px-4 py-3.5">
                  <CurrencyTokenIcon currency="gold-volts" size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gold">
                      {GEMS_LABEL}
                    </p>
                    <p className="truncate text-xs text-muted">{GEMS_FULL_NAME}</p>
                  </div>
                  <p
                    className="text-xl font-black tabular-nums text-white"
                    aria-busy={gemBalanceLoading}
                  >
                    {gemBalanceLoading ? "…" : goldVolts.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-fuchsia/25 bg-[#0f212e]/80 px-4 py-3.5">
                  <CurrencyTokenIcon currency="sweeps-cash" size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia">
                      {RIPS_LABEL}
                    </p>
                    <p className="truncate text-xs text-muted">{RIPS_FULL_NAME}</p>
                  </div>
                  <p className="text-xl font-black tabular-nums text-white">
                    {sweepsCash.toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-center text-[11px] text-muted">
                Spend Gems to unbox grails · Earn Rips to redeem premium rewards
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRedeem}
                  className="rounded-xl border border-border bg-[#0f212e] px-3 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-fuchsia/40 hover:bg-slate-elevated"
                >
                  Redeem
                </button>
                <button
                  type="button"
                  onClick={handleBuyGems}
                  className="rounded-xl bg-[#ff007a] px-3 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
                >
                  Buy Gems
                </button>
              </div>
            </div>
          )}

          {walletModalTab === "daily-bonus" && <DailyBonusPanel />}

          {walletModalTab === "top-up" && (
            <div className="space-y-4">
              {canClaimStarter ? (
                <div className="rounded-xl border border-fuchsia/30 bg-[#0f212e]/80 p-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia">
                    Starter rescue
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Your gem balance is below {LOW_GEMS_THRESHOLD}. Claim a one-time free starter
                    pack to keep ripping.
                  </p>
                  <p className="mt-4 text-2xl font-black tabular-nums text-gold">
                    +{STARTER_GEMS_GRANT.toLocaleString()} {GEMS_LABEL}
                  </p>
                  <button
                    type="button"
                    onClick={handleStarterClaim}
                    className="mt-5 w-full rounded-xl bg-[#ff007a] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
                  >
                    Claim Free Starter Tokens
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-border/80 bg-[#0f212e]/60 px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-white">You&apos;re funded</p>
                  <p className="mt-2 text-sm text-muted">
                    Starter tokens are only available when your balance drops below{" "}
                    {LOW_GEMS_THRESHOLD} {GEMS_LABEL}.
                  </p>
                  <button
                    type="button"
                    onClick={handleBuyGems}
                    className="mt-6 w-full rounded-xl border border-border bg-slate-elevated px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-fuchsia/40"
                  >
                    Buy More Gems
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
