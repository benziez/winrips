import { useState } from "react";
import { REWARD_TIERS } from "../../data/rewards";
import { useApp } from "../../context/AppContext";
import { formatGems, RETAIL_COPY } from "../../constants/retail";
import { Button } from "../ui/Button";

export function RewardsView() {
  const { goldVolts, addGoldVolts, showCashoutToast } = useApp();
  const [affiliateLink] = useState("https://winrips.io/ref/CRYPTOKING");
  const [claimedToday, setClaimedToday] = useState(false);

  function handleClaimDaily() {
    if (claimedToday) return;
    addGoldVolts(2500);
    setClaimedToday(true);
    showCashoutToast(`⚡ +${formatGems(2500)} claimed — daily bonus credited`);
  }

  function handleCopyAffiliate() {
    void navigator.clipboard.writeText(affiliateLink);
    showCashoutToast("Affiliate link copied to clipboard");
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 max-w-[1600px] mx-auto w-full space-y-5">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia mb-1">
          Promotions
        </p>
        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          Rewards &amp; Affiliates
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-slate p-5">
          <h2 className="text-sm font-bold text-white mb-3">Daily {RETAIL_COPY.currency}</h2>
          <p className="text-xs text-muted mb-4">
            Claim your free play currency. Balance:{" "}
            <span className="text-gold font-bold">{formatGems(goldVolts)}</span>
          </p>
          <Button
            variant="open"
            size="md"
            disabled={claimedToday}
            onClick={handleClaimDaily}
            className="w-full sm:w-auto"
          >
            {claimedToday ? "Claimed Today" : `Claim ${formatGems(2500)}`}
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-slate p-5">
          <h2 className="text-sm font-bold text-white mb-3">Affiliate Link</h2>
          <p className="text-xs text-muted mb-3">Earn 5% of referred pack volume.</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={affiliateLink}
              className="flex-1 px-3 py-2 rounded-lg bg-obsidian border border-border text-xs text-white"
            />
            <Button variant="gold" size="md" onClick={handleCopyAffiliate}>
              Copy
            </Button>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-slate p-5">
        <h2 className="text-sm font-bold text-white mb-4">Active Tiers</h2>
        <ul className="space-y-3 list-none p-0 m-0">
          {REWARD_TIERS.map((tier) => (
            <li
              key={tier.id}
              className="rounded-lg border border-border bg-metallic p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-white">{tier.name}</h3>
                  {tier.unlocked ? (
                    <span className="text-[9px] font-bold uppercase text-fuchsia">
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted mt-0.5">{tier.requirement}</p>
                <p className="text-xs text-gold mt-1">{tier.bonus}</p>
              </div>
              <div className="sm:w-32 shrink-0">
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-fuchsia transition-all duration-300"
                    style={{ width: `${tier.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted mt-1 text-right tabular-nums">
                  {tier.progress}%
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
