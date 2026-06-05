import { normalizePackId } from "../constants/packIdAliases";
import { packImagePath } from "../utils/assetPaths";
import {
  BUNDLED_PLACEHOLDER_PACK,
  PACK_COVER_URL_BY_STEM,
} from "./bundledPackCovers";

/** Catalog pack id → cover filename stem when they differ. */
const PACK_ID_TO_STEM: Record<string, string> = {
  "god-pack-1999": "1999-god",
  "duelist-starter-cache": "placeholder-pack",
  "legacy-collection-raid": "placeholder-pack",
  "shadow-rare-hunt": "placeholder-pack",
  "toon-chaos-edition": "placeholder-pack",
  "exodia-chase-protocol": "placeholder-pack",
  "millennium-tin-premium": "placeholder-pack",
};

/** Infinite Series — bundled from `public/images/packs/` for Capacitor-native shells. */
const LOCAL_PUBLIC_PACK_COVERS: Record<string, string> = {
  "infinite-prime": packImagePath("infinite-prime"),
  "infinite-apex": packImagePath("infinite-apex"),
  "infinite-zenith": packImagePath("infinite-zenith"),
  "infinite-omega": packImagePath("infinite-omega"),
};

function lookupCoverByStem(stem: string): string | undefined {
  const key = stem.toLowerCase();
  return (
    PACK_COVER_URL_BY_STEM[key] ??
    PACK_COVER_URL_BY_STEM[`${key}-cover`] ??
    PACK_COVER_URL_BY_STEM[key.replace(/-cover$/, "")]
  );
}

function resolveStem(packId: string): string {
  const normalized = normalizePackId(packId).toLowerCase();
  return PACK_ID_TO_STEM[normalized] ?? normalized;
}

export { BUNDLED_PLACEHOLDER_PACK };

/** Pack id → bundled cover URL. */
export const BUNDLED_PACK_COVERS: Record<string, string> = (() => {
  const record: Record<string, string> = { ...LOCAL_PUBLIC_PACK_COVERS };

  for (const [stem, url] of Object.entries(PACK_COVER_URL_BY_STEM)) {
    if (!stem.endsWith("-cover")) record[stem] = url;
  }

  for (const packId of Object.keys(PACK_ID_TO_STEM)) {
    const url = lookupCoverByStem(resolveStem(packId));
    if (url) record[packId] = url;
  }

  for (const packId of Object.keys(PACK_ID_TO_STEM)) {
    if (!record[packId] && BUNDLED_PLACEHOLDER_PACK) {
      record[packId] = BUNDLED_PLACEHOLDER_PACK;
    }
  }

  return record;
})();

export function getBundledPackCover(packId: string): string | undefined {
  const normalized = normalizePackId(packId).toLowerCase();
  return (
    LOCAL_PUBLIC_PACK_COVERS[packId] ??
    LOCAL_PUBLIC_PACK_COVERS[normalized] ??
    BUNDLED_PACK_COVERS[packId] ??
    BUNDLED_PACK_COVERS[normalized] ??
    lookupCoverByStem(resolveStem(packId))
  );
}
