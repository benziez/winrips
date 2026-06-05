import { getBundledPackCover, BUNDLED_PLACEHOLDER_PACK } from "../assets/packCoverMap";
import { resolveAssetUrl } from "./resolveAssetUrl";

/** Resolve pack cover URL for preloading (mirrors `usePackCover` without hooks). */
export function resolvePackCoverUrl(packId: string, remoteSrc?: string | null): string {
  const bundled = getBundledPackCover(packId);
  if (bundled) return resolveAssetUrl(bundled);

  const trimmed = remoteSrc?.trim() ?? "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("images/") || trimmed.includes("/assets/")) {
    return resolveAssetUrl(trimmed);
  }

  return BUNDLED_PLACEHOLDER_PACK;
}

/** Warm the browser cache for a list of image URLs. */
export function preloadImageUrls(urls: Iterable<string>): void {
  const seen = new Set<string>();
  for (const raw of urls) {
    const url = raw.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}
