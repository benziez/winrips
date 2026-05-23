import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { setDevGemBalance } from "../../lib/paymentsApi";

/** Fixed dev-only controls for testing live balance sync. */
export function DevBalanceTools() {
  const { userId, goldVolts, syncGemBalanceFromServer, showCashoutToast } = useApp();
  const [busy, setBusy] = useState(false);

  if (!import.meta.env.DEV) return null;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dev balance action failed.";
      showCashoutToast(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed bottom-20 right-3 z-[60] flex max-w-[220px] flex-col gap-2 rounded-lg border border-amber-500/40 bg-[#121318]/95 p-3 text-left shadow-lg backdrop-blur-sm lg:bottom-4"
      role="region"
      aria-label="Dev balance tools"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Dev balance</p>
      <p className="truncate font-mono text-[10px] text-[#A0A5B5]" title={userId}>
        {userId}
      </p>
      <p className="text-xs text-white">
        Header: <span className="font-bold tabular-nums text-[#FF007F]">{goldVolts.toLocaleString()}</span>{" "}
        gems
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          run(async () => {
            await setDevGemBalance(userId, 5000);
            await syncGemBalanceFromServer();
            showCashoutToast("Set balance to 5,000 gems in KV.");
          })
        }
        className="rounded-md bg-amber-500/20 px-2 py-1.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/30 disabled:opacity-50"
      >
        Set 5,000 gems
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          run(async () => {
            await syncGemBalanceFromServer();
            showCashoutToast("Refreshed balance from API.");
          })
        }
        className="rounded-md border border-[#2A2D34] px-2 py-1.5 text-[11px] font-semibold text-[#A0A5B5] hover:text-white disabled:opacity-50"
      >
        Refresh from API
      </button>
      <p className="text-[9px] leading-snug text-[#A0A5B5]">
        Set DEV_BALANCE_SECRET + VITE_DEV_BALANCE_SECRET in .env to use KV dev balance API.
      </p>
    </div>
  );
}
