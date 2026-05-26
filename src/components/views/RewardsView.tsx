import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Button } from "../ui/Button";
import { MobileRipSettingsToggle } from "../mobile/MobileRipSettingsToggle";
import { GlassSurface } from "../mobile/GlassSurface";
import { MOBILE_COLORS, OBSIDIAN_GOLD } from "../mobile/mobileTheme";

export function RewardsView() {
  const { showCashoutToast } = useApp();
  const [affiliateLink] = useState("https://winrips.io/ref/CRYPTOKING");

  function handleCopyAffiliate() {
    void navigator.clipboard.writeText(affiliateLink);
    showCashoutToast("Affiliate link copied to clipboard");
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <header>
        <p
          className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia data-[shell=mobile]:text-[#D4AF37]"
        >
          Promotions
        </p>
        <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
          Rewards &amp; Affiliates
        </h1>
      </header>

      <MobileRipSettingsToggle />

      <GlassSurface
        variant="default"
        className="hidden max-w-xl rounded-xl p-5 data-[shell=mobile]:block"
      >
        <h2 className="mb-3 text-sm font-bold text-white">Affiliate Link</h2>
        <p className="mb-3 text-xs" style={{ color: MOBILE_COLORS.textMuted }}>
          Earn 5% of referred pack volume.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={affiliateLink}
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
          />
          <button
            type="button"
            onClick={handleCopyAffiliate}
            className="shrink-0 rounded-full border px-4 py-2 text-xs font-bold"
            style={{
              borderColor: OBSIDIAN_GOLD.base,
              color: OBSIDIAN_GOLD.bright,
            }}
          >
            Copy
          </button>
        </div>
      </GlassSurface>

      <section className="card-pack max-w-xl rounded-xl border border-border bg-slate p-5 data-[shell=mobile]:hidden">
        <h2 className="mb-3 text-sm font-bold text-white">Affiliate Link</h2>
        <p className="mb-3 text-xs text-muted">Earn 5% of referred pack volume.</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={affiliateLink}
            className="flex-1 rounded-lg border border-border bg-obsidian px-3 py-2 text-xs text-white"
          />
          <Button variant="gold" size="md" onClick={handleCopyAffiliate}>
            Copy
          </Button>
        </div>
      </section>
    </div>
  );
}
