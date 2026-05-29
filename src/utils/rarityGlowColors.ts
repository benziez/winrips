import type { Rarity } from "../types";
import type { StoreRarity } from "../types/store";

export interface RarityGlowPalette {
  rgb: string;
  needle: string;
}

/** Spotlight / wash colors keyed to storefront drop-table tiers. */
const STORE_GLOW: Record<StoreRarity, RarityGlowPalette> = {
  Common: { rgb: "200, 210, 220", needle: "#c8d2dc" },
  Epic: { rgb: "52, 211, 153", needle: "#34d399" },
  Rare: { rgb: "96, 165, 250", needle: "#60a5fa" },
  Legendary: { rgb: "245, 158, 11", needle: "#f59e0b" },
  Mythic: { rgb: "255, 0, 122", needle: "#ff007a" },
};

export function glowPaletteForStoreRarity(tier: StoreRarity): RarityGlowPalette {
  return STORE_GLOW[tier] ?? STORE_GLOW.Common;
}

/** Fallback when only catalog Card.rarity is available. */
export function glowPaletteForCardRarity(rarity: Rarity): RarityGlowPalette {
  if (rarity === "Ancient Rare") return STORE_GLOW.Legendary;
  if (rarity === "Rare") return STORE_GLOW.Rare;
  return STORE_GLOW.Common;
}
