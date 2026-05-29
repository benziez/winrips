import type { CSSProperties } from "react";
import type { RarityGlowPalette } from "../../utils/rarityGlowColors";

interface SpinStageAtmosphereProps {
  settled: boolean;
  fastTransition: boolean;
  rarityGlow: RarityGlowPalette;
}

/** Neutral pool + wash during spin; rarity-colored glow dims in, intensifies on land. */
export function SpinStageAtmosphere({
  settled,
  fastTransition,
  rarityGlow,
}: SpinStageAtmosphereProps) {
  const duration = fastTransition ? "150ms" : "400ms";
  const rarityTransition: CSSProperties = {
    opacity: settled ? 1 : 0.45,
    transition: `opacity ${duration} ease`,
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="spin-stage-glow-wash-neutral absolute inset-0" />
      <div
        className="spin-stage-glow-wash-rarity absolute inset-0"
        style={{
          ...rarityTransition,
          background: `linear-gradient(180deg, rgba(${rarityGlow.rgb}, 0.07) 0%, transparent 16%, transparent 84%, rgba(${rarityGlow.rgb}, 0.07) 100%)`,
        }}
      />
      <div className="spin-stage-glow-pool-neutral absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div
        className="spin-stage-glow-pool-rarity absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          ...rarityTransition,
          background: `radial-gradient(ellipse 88% 74% at 50% 48%, rgba(${rarityGlow.rgb}, 0.42) 0%, rgba(${rarityGlow.rgb}, 0.16) 40%, transparent 72%)`,
        }}
      />
    </div>
  );
}
