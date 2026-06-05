import { useMemo } from "react";
import { getBundledPackCover, BUNDLED_PLACEHOLDER_PACK } from "../assets/packCoverMap";
import { useFallbackImageSrc } from "./useFallbackImageSrc";
import { resolveAssetUrl } from "../utils/resolveAssetUrl";

function resolvePackCoverSrc(packId: string, remoteSrc?: string | null): string {
  const bundled = getBundledPackCover(packId);
  if (bundled) return resolveAssetUrl(bundled);

  const trimmed = remoteSrc?.trim() ?? "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("images/") || trimmed.includes("/assets/")) {
    return resolveAssetUrl(trimmed);
  }

  return BUNDLED_PLACEHOLDER_PACK;
}

/** Mystery pack graphic — bundled via `import.meta.glob` in `bundledPackCovers.ts`. */
export const MYSTERY_PACK_COVER = BUNDLED_PLACEHOLDER_PACK;

/**
 * Resolves pack cover art from Supabase Storage CDN (`pack-covers` bucket).
 * Never returns a broken path; missing packs use Mystery Pack art.
 */
export function usePackCover(packId: string, remoteSrc?: string | null) {
  const resolved = useMemo(
    () => resolvePackCoverSrc(packId, remoteSrc),
    [packId, remoteSrc],
  );

  return useFallbackImageSrc(resolved, MYSTERY_PACK_COVER);
}

/** @deprecated Use `usePackCover` */
export const usePackCoverImage = usePackCover;
