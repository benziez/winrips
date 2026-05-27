import { useEffect } from "react";
import type { StoreRarity } from "../../types/store";
import {
  fireRevealPayoffHaptics,
  getStoreRevealPayoff,
  revealPayoffDurationMs,
  revealShakeClassName,
} from "../../utils/revealPayoff";
import { MobileRevealFlare } from "./MobileRevealFlare";
import { MobileRevealParticles } from "./MobileRevealParticles";

interface MobileRevealPayoffProps {
  /** Increment to fire a new payoff burst. 0 = idle. */
  burstKey: number;
  storeRarity: StoreRarity;
  onShakeClassChange: (className: string | null) => void;
  onFinished?: () => void;
}

export function MobileRevealPayoff({
  burstKey,
  storeRarity,
  onShakeClassChange,
  onFinished,
}: MobileRevealPayoffProps) {
  const payoff = getStoreRevealPayoff(storeRarity);

  useEffect(() => {
    if (burstKey === 0) {
      onShakeClassChange(null);
      return;
    }

    fireRevealPayoffHaptics(payoff.haptic);

    const shakeClass = revealShakeClassName(payoff.shake);
    if (shakeClass) {
      onShakeClassChange(shakeClass);
      const shakeTimer = window.setTimeout(() => onShakeClassChange(null), payoff.shakeDurationMs);
      const finishTimer = window.setTimeout(() => onFinished?.(), revealPayoffDurationMs(storeRarity));

      return () => {
        window.clearTimeout(shakeTimer);
        window.clearTimeout(finishTimer);
        onShakeClassChange(null);
      };
    }

    const finishTimer = window.setTimeout(() => onFinished?.(), revealPayoffDurationMs(storeRarity));
    return () => {
      window.clearTimeout(finishTimer);
    };
  }, [burstKey, onFinished, onShakeClassChange, payoff.haptic, payoff.shake, payoff.shakeDurationMs, storeRarity]);

  if (burstKey === 0) return null;

  const particles =
    payoff.particleCount > 0 ? (
      payoff.particleScope === "card" ? (
        <div
          className="pointer-events-none absolute left-1/2 z-[12] h-[min(72dvh,520px)] w-[min(85vw,400px)] -translate-x-1/2"
          style={{ top: "calc(max(0.5rem, env(safe-area-inset-top)) + 6dvh)" }}
        >
          <MobileRevealParticles
            count={payoff.particleCount}
            storeRarity={storeRarity}
            scope="card"
          />
        </div>
      ) : (
        <MobileRevealParticles
          count={payoff.particleCount}
          storeRarity={storeRarity}
          scope="full"
        />
      )
    ) : null;

  return (
    <>
      <MobileRevealFlare mode={payoff.flare} />
      {particles}
    </>
  );
}
