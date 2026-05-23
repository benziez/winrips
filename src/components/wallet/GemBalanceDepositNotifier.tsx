import { useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { playDepositSound, preloadDepositSound } from "../../lib/depositSound";

/**
 * Watches synced gem balance; celebrates real increases (e.g. NOWPayments IPN credit).
 * Skips the first balance sample after login so initial fetch does not trigger fanfare.
 */
export function GemBalanceDepositNotifier() {
  const { isLoggedIn, goldVolts, gemBalanceLoading, showDepositSuccessToast } = useApp();

  const previousGemsRef = useRef<number | null>(null);
  const baselineEstablishedRef = useRef(false);

  useEffect(() => {
    void preloadDepositSound();
    const unlock = () => void preloadDepositSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      previousGemsRef.current = null;
      baselineEstablishedRef.current = false;
      return;
    }

    if (gemBalanceLoading) return;

    const previous = previousGemsRef.current;

    if (!baselineEstablishedRef.current) {
      previousGemsRef.current = goldVolts;
      baselineEstablishedRef.current = true;
      return;
    }

    if (previous !== null && goldVolts > previous) {
      const gemsAdded = goldVolts - previous;
      playDepositSound();
      showDepositSuccessToast(gemsAdded);
    }

    previousGemsRef.current = goldVolts;
  }, [isLoggedIn, goldVolts, gemBalanceLoading, showDepositSuccessToast]);

  return null;
}
