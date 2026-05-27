import type { StoreRarity } from "../types/store";
import { hapticHeavyImpact, hapticTabSelect } from "./mobileHaptics";
import { isNativeCapacitorApp } from "./platform";
import { normalizeStoreRarity } from "./revealGlow";

export type RevealShakeIntensity = "none" | "light" | "medium" | "heavy";
export type RevealPayoffHaptic = "none" | "light" | "medium" | "heavy" | "heavy-double";
export type RevealFlareMode = "none" | "gold" | "gold-extended";
export type RevealParticleScope = "none" | "card" | "full";

export interface StoreRevealPayoff {
  particleCount: number;
  particleScope: RevealParticleScope;
  shake: RevealShakeIntensity;
  shakeDurationMs: number;
  flare: RevealFlareMode;
  haptic: RevealPayoffHaptic;
}

/** Phase 3 payoff — particles, shake, flare, haptics per store tier. */
export const STORE_REVEAL_PAYOFF: Record<StoreRarity, StoreRevealPayoff> = {
  Common: {
    particleCount: 0,
    particleScope: "none",
    shake: "none",
    shakeDurationMs: 0,
    flare: "none",
    haptic: "none",
  },
  Rare: {
    particleCount: 8,
    particleScope: "full",
    shake: "light",
    shakeDurationMs: 400,
    flare: "none",
    haptic: "light",
  },
  Epic: {
    particleCount: 20,
    particleScope: "card",
    shake: "medium",
    shakeDurationMs: 450,
    flare: "none",
    haptic: "medium",
  },
  Legendary: {
    particleCount: 40,
    particleScope: "full",
    shake: "heavy",
    shakeDurationMs: 500,
    flare: "gold",
    haptic: "heavy",
  },
  Mythic: {
    /** Capped at 40 (not 60+) — keeps SVG burst smooth on simulator/device. */
    particleCount: 40,
    particleScope: "full",
    shake: "heavy",
    shakeDurationMs: 600,
    flare: "gold-extended",
    haptic: "heavy-double",
  },
};

export function getStoreRevealPayoff(tier?: string | null): StoreRevealPayoff {
  return STORE_REVEAL_PAYOFF[normalizeStoreRarity(tier)];
}

export function revealShakeClassName(shake: RevealShakeIntensity): string | null {
  if (shake === "none") return null;
  return `animate-screen-shake-${shake}`;
}

async function hapticMediumImpact(): Promise<void> {
  if (!isNativeCapacitorApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* unavailable */
  }
}

/** Native-only reveal payoff haptics (no new libraries). */
export function fireRevealPayoffHaptics(haptic: RevealPayoffHaptic): void {
  if (!isNativeCapacitorApp() || haptic === "none") return;

  if (haptic === "light") {
    void hapticTabSelect();
    return;
  }
  if (haptic === "medium") {
    void hapticMediumImpact();
    return;
  }
  if (haptic === "heavy") {
    void hapticHeavyImpact();
    return;
  }
  void hapticHeavyImpact();
  window.setTimeout(() => void hapticHeavyImpact(), 120);
}

/** Longest payoff FX window — used for overlay cleanup. */
export function revealPayoffDurationMs(tier?: string | null): number {
  const payoff = getStoreRevealPayoff(tier);
  const particleMs = payoff.particleCount > 0 ? 1_200 : 0;
  const flareMs = payoff.flare === "gold-extended" ? 900 : payoff.flare === "gold" ? 700 : 0;
  return Math.max(payoff.shakeDurationMs, particleMs, flareMs, 0);
}
