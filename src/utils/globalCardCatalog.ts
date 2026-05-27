import { getPackDropTable } from "../data/packDropTables";
import type { Card } from "../types";
import type { CatalogPack } from "../types/box";

/**
 * Merge pullable cards across packs — one row per card id (highest gem value wins), sorted high → low.
 * Read-only; uses existing drop tables only.
 */
export function buildGlobalCardCatalog(packs: readonly CatalogPack[]): Card[] {
  const byId = new Map<string, Card>();

  for (const pack of packs) {
    const table = getPackDropTable(pack.id);
    for (const entry of table) {
      const existing = byId.get(entry.card.id);
      if (!existing || entry.card.value > existing.value) {
        byId.set(entry.card.id, entry.card);
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.value - a.value);
}
