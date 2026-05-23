import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { DAILY_BONUS_GEMS, GEMS_LABEL } from "../../constants/dualCurrency";
import { useDailyBonusCountdown } from "../../hooks/useDailyBonusCountdown";

export function DailyBonusPanel() {
  const { claimDailyBonusGems, showCashoutToast } = useApp();
  const { ready, countdownLabel, persistClaim } = useDailyBonusCountdown();
  const [claiming, setClaiming] = useState(false);

  function handleClaim() {
    if (!ready || claiming) return;
    setClaiming(true);
    try {
      claimDailyBonusGems();
      persistClaim();
      showCashoutToast(`Daily bonus claimed: +${DAILY_BONUS_GEMS} ${GEMS_LABEL}.`);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="flex flex-col items-center rounded-xl border border-border/80 bg-[#0f212e]/60 px-6 py-8 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-fuchsia">
        Daily reward
      </p>
      <p className="mt-3 text-4xl font-black tabular-nums tracking-tight text-gold">
        +{DAILY_BONUS_GEMS} {GEMS_LABEL}
      </p>
      <p className="mt-2 text-sm text-muted">
        {ready
          ? "Your bonus is ready to claim."
          : "Come back when the timer resets."}
      </p>

      <div className="mt-6 w-full max-w-xs">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {ready ? "Ready now" : "Next claim in"}
        </p>
        <p
          className={`mt-1 font-mono text-3xl font-black tabular-nums tracking-widest ${
            ready ? "text-[#00e701]" : "text-white"
          }`}
          aria-live="polite"
        >
          {ready ? "00:00:00" : countdownLabel}
        </p>
      </div>

      <button
        type="button"
        disabled={!ready || claiming}
        onClick={handleClaim}
        className="mt-8 w-full max-w-xs rounded-xl bg-[#ff007a] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {ready ? (claiming ? "Claiming…" : "Claim Daily Bonus") : "Bonus locked"}
      </button>
    </div>
  );
}
