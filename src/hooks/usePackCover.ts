import { useMemo } from "react";
import { getBundledPackCover, BUNDLED_PLACEHOLDER_PACK } from "../assets/packCoverMap";
import { useFallbackImageSrc } from "./useFallbackImageSrc";

/** Mystery pack graphic — bundled via `import.meta.glob` in `bundledPackCovers.ts`. */
export const MYSTERY_PACK_COVER = BUNDLED_PLACEHOLDER_PACK;

/**
 * Resolves pack cover art from Vite-globbed local assets (`src/assets/packs/*`).
 * Never returns a broken path; missing packs use Mystery Pack art.
 */
export function usePackCover(packId: string, remoteSrc?: string | null) {
  const resolved = useMemo(() => {
    const bundled = getBundledPackCover(packId);
    if (bundled) return bundled;

    const trimmed = remoteSrc?.trim() ?? "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.includes("/assets/")) return trimmed;

    return MYSTERY_PACK_COVER;
  }, [packId, remoteSrc]);

  return useFallbackImageSrc(resolved, MYSTERY_PACK_COVER);
}

/** @deprecated Use `usePackCover` */
export const usePackCoverImage = usePackCover;
