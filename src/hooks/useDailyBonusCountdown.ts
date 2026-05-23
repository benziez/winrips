import { useEffect, useState } from "react";
import { DAILY_BONUS_COOLDOWN_MS, DAILY_CLAIM_STORAGE_KEY } from "../constants/dualCurrency";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function readLastClaimMs(): number {
  try {
    const raw = localStorage.getItem(DAILY_CLAIM_STORAGE_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function useDailyBonusCountdown() {
  const [remainingMs, setRemainingMs] = useState(0);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    const tick = () => {
      const last = readLastClaimMs();
      const elapsed = Date.now() - last;
      const left = Math.max(0, DAILY_BONUS_COOLDOWN_MS - elapsed);
      setRemainingMs(left);
      setReady(left <= 0);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return {
    ready,
    remainingMs,
    countdownLabel: formatCountdown(remainingMs),
    persistClaim: () => {
      try {
        localStorage.setItem(DAILY_CLAIM_STORAGE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      setRemainingMs(DAILY_BONUS_COOLDOWN_MS);
      setReady(false);
    },
  };
}
