import type { StoreItem } from "../types/store";
import { STORE_TIERS } from "../types/store";

/** Tier probability budgets (sum = 100). */
export const SPORTS_TIER_BUDGET: Record<StoreItem["rarity"], number> = {
  Mythic: 0.1,
  Legendary: 1,
  Epic: 7.5,
  Rare: 11.5,
  Common: 80.9,
};

export function finalizeSportsPool(
  category: StoreItem["setId"],
  setName: string,
  drafts: Omit<StoreItem, "probability" | "setId" | "setName" | "number">[],
): StoreItem[] {
  const byTier = new Map<StoreItem["rarity"], typeof drafts>();
  for (const d of drafts) {
    const list = byTier.get(d.rarity) ?? [];
    list.push(d);
    byTier.set(d.rarity, list);
  }

  const items: StoreItem[] = [];
  let idx = 0;
  for (const rarity of STORE_TIERS) {
    const tierDrafts = byTier.get(rarity) ?? [];
    const budget = SPORTS_TIER_BUDGET[rarity];
    const each = tierDrafts.length > 0 ? budget / tierDrafts.length : 0;
    for (const d of tierDrafts) {
      idx += 1;
      items.push({
        ...d,
        probability: Math.round(each * 1000) / 1000,
        setId: category,
        setName,
        number: String(idx).padStart(3, "0"),
      });
    }
  }

  const sum = items.reduce((a, i) => a + i.probability, 0);
  const drift = Math.round((100 - sum) * 1000) / 1000;
  const common = items.find((i) => i.rarity === "Common");
  if (common && drift !== 0) common.probability += drift;

  return items;
}
