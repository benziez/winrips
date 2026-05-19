import type { LobbyCategoryFilter, PackCategory } from "../types";

/** Categories locked until post-launch — Pokémon is live at launch. */
export const COMING_SOON_CATEGORIES = [
  "nba",
  "nfl",
  "ufc",
  "yugioh",
] as const satisfies readonly PackCategory[];

export type ComingSoonCategory = (typeof COMING_SOON_CATEGORIES)[number];

export function isComingSoonCategory(
  category: LobbyCategoryFilter,
): category is ComingSoonCategory {
  return (COMING_SOON_CATEGORIES as readonly string[]).includes(category);
}

export const COMING_SOON_HEADLINES: Record<ComingSoonCategory, string> = {
  nba: "NBA HARDWOOD EXPANSION",
  nfl: "NFL GRIDIRON EXPANSION",
  ufc: "UFC OCTAGON EXPANSION",
  yugioh: "YU-GI-OH! DUELIST EXPANSION",
};

export interface PackCategoryTab {
  id: LobbyCategoryFilter;
  label: string;
  icon: string;
}

export const PACK_CATEGORY_TABS: PackCategoryTab[] = [
  { id: "all", label: "All Drops", icon: "◈" },
  { id: "pokemon", label: "Pokémon TCG", icon: "⚡" },
  { id: "ufc", label: "UFC Slabs & Autographs", icon: "🥊" },
  { id: "nba", label: "NBA Basketball", icon: "🏀" },
  { id: "nfl", label: "NFL Football", icon: "🏈" },
  { id: "yugioh", label: "Yu-Gi-Oh!", icon: "🃏" },
];
