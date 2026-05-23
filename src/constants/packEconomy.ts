import type { CatalogPack } from "../types/box";
import {
  createFloorFillerItems,
  floorFillerCountForPack,
  rebuildFloorFillerRegistry,
} from "./floorFillers";

/**
 * Injects 3–5 floor filler Commons (10–20% of spin cost) into every pack pool
 * and registers them for storefront + validation lookups.
 */
export function enrichPackWithFloorEconomy(pack: CatalogPack): CatalogPack {
  const fillers = createFloorFillerItems(pack);
  const fillerIds = fillers.map((item) => item.id);
  const mergedItems = [...pack.items];

  for (const id of fillerIds) {
    if (!mergedItems.includes(id)) mergedItems.push(id);
  }

  return { ...pack, items: mergedItems };
}

/** Apply floor economy to the full catalog and rebuild the filler registry. */
export function initializePackFloorEconomy(packs: CatalogPack[]): CatalogPack[] {
  const enriched = packs.map(enrichPackWithFloorEconomy);
  rebuildFloorFillerRegistry(enriched);
  return enriched;
}

export { floorFillerCountForPack };
