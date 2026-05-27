import type { StoreRarity } from "../types/store";

const STORE_TIERS: StoreRarity[] = ["Common", "Rare", "Epic", "Legendary", "Mythic"];

/** Phase 3.5a — multi-revolution Y-spin timing (constant across tiers). */
export const REVEAL_SPIN_DURATION_MS = 2_400;
export const REVEAL_SPIN_DELAY_MS = 300;
export const REVEAL_SPIN_EASE = [0.15, 0, 0.05, 1] as const;

/** Phase 3.6 — slower spin for Legendary/Mythic buildup (capped at 5s). */
export function getRevealSpinDuration(
  _storeRarity: StoreRarity,
  spinSpeedMultiplier: number,
): number {
  const multiplier = spinSpeedMultiplier > 0 ? spinSpeedMultiplier : 1;
  return Math.min(REVEAL_SPIN_DURATION_MS / multiplier, 5_000);
}

/** Neutral gray card back before rarity lands (Phase 3.5b). */
export const REVEAL_BACK_BASE = "#E8E5DF";

/** Rarity destination colors at ~15% blend strength for back tint during spin. */
const STORE_RARITY_BACK_TINT: Record<StoreRarity, string> = {
  Common: REVEAL_BACK_BASE,
  Rare: "#D8E4EF",
  Epic: "#E9D5F5",
  Legendary: "#EDE4C8",
  Mythic: "#F0E6C8",
};

/** 5-tier reveal ambient colors — mirrors mobileTheme RARITY_GLOW_COLOR tokens. */
export const STORE_RARITY_REVEAL_GLOW_COLOR: Record<StoreRarity, string> = {
  Common: "rgba(255, 255, 255, 0.08)",
  Rare: "rgba(59, 130, 246, 0.5)",
  Epic: "rgba(255, 0, 127, 0.55)",
  Legendary: "rgba(212, 175, 55, 0.62)",
  Mythic: "rgba(242, 214, 128, 0.72)",
};

export interface StoreRevealIntensity {
  glowOpacityPeak: number;
  glowPulseDuration: number;
  glowScalePeak: number;
  flipStiffness: number;
  flipDamping: number;
}

/** Cinematic reveal curve — Common minimal, Mythic screen-stopping. */
export const STORE_REVEAL_INTENSITY: Record<StoreRarity, StoreRevealIntensity> = {
  Common: {
    glowOpacityPeak: 0.15,
    glowPulseDuration: 4.5,
    glowScalePeak: 1.05,
    flipStiffness: 220,
    flipDamping: 18,
  },
  Rare: {
    glowOpacityPeak: 0.3,
    glowPulseDuration: 3.8,
    glowScalePeak: 1.15,
    flipStiffness: 200,
    flipDamping: 19,
  },
  Epic: {
    glowOpacityPeak: 0.5,
    glowPulseDuration: 3.0,
    glowScalePeak: 1.3,
    flipStiffness: 180,
    flipDamping: 20,
  },
  Legendary: {
    glowOpacityPeak: 0.75,
    glowPulseDuration: 2.2,
    glowScalePeak: 1.5,
    flipStiffness: 160,
    flipDamping: 22,
  },
  Mythic: {
    glowOpacityPeak: 1.0,
    glowPulseDuration: 1.6,
    glowScalePeak: 1.8,
    flipStiffness: 130,
    flipDamping: 24,
  },
};

const PULSE_MIN_RATIO = 0.62;
const SCALE_MIN_RATIO = 0.877;

export function normalizeStoreRarity(tier?: string | null): StoreRarity {
  if (tier && STORE_TIERS.includes(tier as StoreRarity)) {
    return tier as StoreRarity;
  }
  return "Common";
}

export function getStoreRevealIntensity(tier?: string | null): StoreRevealIntensity {
  return STORE_REVEAL_INTENSITY[normalizeStoreRarity(tier)];
}

/**
 * Total rotateY degrees for the slot-machine spin.
 * Starts on back (0°), ends on front (180° + n×360°).
 * Common: 4 revs, Rare: 5 revs, Epic/Legendary/Mythic: 6 revs.
 */
export function getRevealSpinDegrees(tier?: string | null): number {
  const normalized = normalizeStoreRarity(tier);
  const fullRevolutions = normalized === "Common" ? 4 : normalized === "Rare" ? 5 : 6;
  return fullRevolutions * 360 + 180;
}

/** Landed front-face rotation (static complete state). */
export const REVEAL_SPIN_FRONT_ROTATION = 180;

export function getRevealBackTintTarget(tier?: string | null): string {
  return STORE_RARITY_BACK_TINT[normalizeStoreRarity(tier)];
}

export function getStoreRevealGlowColor(tier?: string | null): string {
  return STORE_RARITY_REVEAL_GLOW_COLOR[normalizeStoreRarity(tier)];
}

export function getStoreRevealGlowGradient(tier?: string | null): string {
  const core = getStoreRevealGlowColor(tier);
  return `radial-gradient(circle at 50% 42%, ${core} 0%, transparent 70%)`;
}

export function buildRevealGlowPulse(intensity: StoreRevealIntensity) {
  const o = intensity.glowOpacityPeak;
  const s = intensity.glowScalePeak;
  return {
    opacity: [o * PULSE_MIN_RATIO, o, o * PULSE_MIN_RATIO],
    scale: [s * SCALE_MIN_RATIO, s, s * SCALE_MIN_RATIO],
  };
}

export function revealGlowPulseTransition(intensity: StoreRevealIntensity) {
  return {
    duration: intensity.glowPulseDuration,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };
}

/** Rarity → reveal ambient color (no React / theme deps). */
export function getRevealGlowColor(rarity?: string): string {
  const r = (rarity ?? "").toLowerCase();
  if (
    r.includes("ancient") ||
    r.includes("mythic") ||
    r.includes("grail") ||
    r.includes("legendary")
  ) {
    return "rgba(255, 215, 0, 0.72)";
  }
  if (r.includes("epic")) {
    return "rgba(255, 0, 127, 0.62)";
  }
  if (r.includes("rare")) {
    return "rgba(59, 130, 246, 0.55)";
  }
  return "rgba(255, 255, 255, 0.1)";
}

export function getRevealGlowGradient(rarity?: string): string {
  const core = getRevealGlowColor(rarity);
  return `radial-gradient(circle at 50% 42%, ${core} 0%, transparent 70%)`;
}
