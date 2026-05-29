import { CARD_PLACEHOLDER_IMAGE } from "../constants/cardAssets";
import { logger } from "../lib/logger";
import { optimizedImageUrl } from "./optimizedImageUrl";
import { isRenderableAssetUrl, resolveAssetUrl } from "./resolveAssetUrl";

/**
 * Resolve collectible art the same way vault/collection tiles do:
 * validate → placeholder fallback → resolve local assets → direct URL (no WebP proxy).
 */
export function resolveCollectibleImageSrc(
  src?: string | null,
  options?: { thumbnail?: boolean },
): string {
  const trimmed = src?.trim() ?? "";
  if (!trimmed) {
    return resolveAssetUrl(CARD_PLACEHOLDER_IMAGE);
  }

  const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
  return optimizedImageUrl(candidate, {
    thumbnail: options?.thumbnail ?? false,
    optimize: false,
  });
}

/** Dev-only audit for spin carousel image resolution. */
export function auditCollectibleImageSources(
  context: string,
  items: { id: string; name: string; image?: string }[],
): void {
  if (!import.meta.env.DEV) return;

  for (const item of items) {
    const raw = item.image?.trim() ?? "";
    const resolved = resolveCollectibleImageSrc(item.image);
    logger.log(`[${context}] collectible image`, {
      id: item.id,
      name: item.name,
      raw: raw || "(empty)",
      resolved: resolved || "(empty)",
    });
  }
}
