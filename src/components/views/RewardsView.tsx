import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Button } from "../ui/Button";

export function RewardsView() {
  const { showCashoutToast } = useApp();
  const [affiliateLink] = useState("https://winrips.io/ref/CRYPTOKING");

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

      <section className="rounded-xl border border-border bg-slate p-5 max-w-xl">
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
  );
}
