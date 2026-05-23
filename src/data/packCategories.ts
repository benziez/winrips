import type { LobbyCategoryFilter, PackCategory } from "../types";

/**
 * Per-pack floor filler injection (3–5 commons @ 10–20% of spin cost) and
 * house-edge odds live in `packEconomy.ts`, `floorFillers.ts`, and `packProbability.ts`.
 */
export const PACK_ECONOMY_ENABLED = true;

/** Post-launch categories — empty while the platform is Pokémon-only at launch. */
export const COMING_SOON_CATEGORIES = [] as const satisfies readonly PackCategory[];

export type ComingSoonCategory = (typeof COMING_SOON_CATEGORIES)[number];

export function isComingSoonCategory(
  category: LobbyCategoryFilter,
): category is ComingSoonCategory {
  return (COMING_SOON_CATEGORIES as readonly string[]).includes(category);
}

export const COMING_SOON_HEADLINES = {} as Record<ComingSoonCategory, string>;

export interface PackCategoryTab {
  id: LobbyCategoryFilter;
  label: string;
}

/** Launch-only: Pokémon storefront — no sports/TCG tabs at launch. */
export const PACK_CATEGORY_TABS: PackCategoryTab[] = [
  { id: "all", label: "All Drops" },
  { id: "pokemon", label: "Pokémon TCG" },
];
