import type { Pack } from "../types";
import { getPackStoreItemsForPack } from "../data/boxCatalog";
import { resolveStoreItemImage } from "./collectibleFallback";

const CYCLE_MS = 1500;

export { CYCLE_MS };

function itemImageUrl(item: { image: string; image_url?: string; id: string }): string | null {
  const url = resolveStoreItemImage(item)?.trim();
  if (!url) return null;
  return url;
}

/** Highest gem-value drop images for lobby card autoplay cycling (full pool, no cap). */
export function getTopValueDropImages(pack: Pack): string[] {
  const items = getPackStoreItemsForPack(pack);
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const urls: string[] = [];

  for (const item of sorted) {
    const url = itemImageUrl(item);
    if (!url || urls.includes(url)) continue;
    urls.push(url);
  }

  return urls;
}
