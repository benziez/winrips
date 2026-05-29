import { normalizeLocalAssetPath, resolveAssetUrl } from "./resolveAssetUrl";
import { apiUrl } from "./apiBaseUrl";

import { isNativeCapacitorApp } from "./platform";

const POKEMON_TCG_HOST = "images.pokemontcg.io";

function isLocalPublicAsset(url: string): boolean {
  const normalized = normalizeLocalAssetPath(url);
  return normalized.startsWith("images/") || normalized.startsWith("assets/");
}

export interface OptimizeImageOptions {
  /** Use standard-res Pokemon TCG art instead of _hires (grid/thumbnails). */
  thumbnail?: boolean;
  /** When false, skip the WebP proxy and use direct source URLs. */
  optimize?: boolean;
  /** @deprecated Use `optimize` instead. */
  preferWebp?: boolean;
}

function isPokemonTcgUrl(url: string): boolean {
  try {
    return new URL(url).hostname === POKEMON_TCG_HOST;
  } catch {
    return false;
  }
}

/** Downscale Pokemon TCG hires PNGs to standard PNG for list/grid contexts. */
export function toPokemonThumbnailUrl(url: string): string {
  if (!url.includes(POKEMON_TCG_HOST)) return url;
  return url.replace(/_hires\.png$/i, ".png");
}

/**
 * Returns an optimized URL for collectible art.
 * Local assets pass through unchanged; Pokemon TCG URLs can be thumbnailed and proxied to WebP.
 */
export function optimizedImageUrl(
  src: string,
  options: OptimizeImageOptions = {},
): string {
  const trimmed = src.trim();
  if (!trimmed) return trimmed;
  if (isLocalPublicAsset(trimmed)) return resolveAssetUrl(trimmed);

  const { thumbnail = false, optimize = true, preferWebp } = options;
  const useWebpProxy = optimize && (preferWebp ?? true);
  let resolved = trimmed;

  if (isPokemonTcgUrl(trimmed) && thumbnail) {
    resolved = toPokemonThumbnailUrl(trimmed);
  }

  if (useWebpProxy && isPokemonTcgUrl(resolved) && import.meta.env.PROD && !isNativeCapacitorApp()) {
    return apiUrl(`/api/image/optimize?url=${encodeURIComponent(resolved)}`);
  }

  return resolved;
}

/** @alias optimizedImageUrl */
export const optimizeCollectibleImageUrl = optimizedImageUrl;

export { POKEMON_TCG_HOST };
