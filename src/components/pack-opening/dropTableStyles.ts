import type { StoreItem } from "../../types/store";

export type DropTableRarity = StoreItem["rarity"];

/** Boxed.gg-style card shell: flat slate + tier gradient + bottom accent. */
export const DROP_TABLE_RARITY_SHELL: Record<DropTableRarity, string> = {
  Mythic:
    "border-fuchsia/30 bg-gradient-to-b from-fuchsia/[0.14] via-[#1a2c38] to-[#1a2c38] shadow-[inset_0_-2px_0_0_rgba(255,0,122,0.55)]",
  Legendary:
    "border-purple/30 bg-gradient-to-b from-purple/[0.12] via-[#1a2c38] to-[#1a2c38] shadow-[inset_0_-2px_0_0_rgba(168,85,247,0.5)]",
  Epic:
    "border-cyan/25 bg-gradient-to-b from-cyan/[0.1] via-[#1a2c38] to-[#1a2c38] shadow-[inset_0_-2px_0_0_rgba(0,229,255,0.35)]",
  Rare:
    "border-border bg-gradient-to-b from-white/[0.04] via-[#1a2c38] to-[#1a2c38] shadow-[inset_0_-2px_0_0_rgba(143,163,179,0.25)]",
  Common:
    "border-border/80 bg-[#1a2c38]/95 shadow-[inset_0_-2px_0_0_rgba(47,69,83,0.45)]",
};

export const DROP_TABLE_RARITY_LABEL: Record<DropTableRarity, string> = {
  Mythic: "text-fuchsia",
  Legendary: "text-purple",
  Epic: "text-cyan",
  Rare: "text-white/80",
  Common: "text-muted",
};

const TIER_RANK: Record<DropTableRarity, number> = {
  Mythic: 0,
  Legendary: 1,
  Epic: 2,
  Rare: 3,
  Common: 4,
};

export function sortDropTableItems(items: StoreItem[]): StoreItem[] {
  return [...items].sort((a, b) => {
    const tierDiff = TIER_RANK[a.rarity] - TIER_RANK[b.rarity];
    if (tierDiff !== 0) return tierDiff;
    if (b.value !== a.value) return b.value - a.value;
    return b.probability - a.probability;
  });
}
