/**
 * Pack cover URLs served from Supabase Storage CDN (public bucket `pack-covers`).
 * Upload / refresh via `node scripts/uploadPackCoversToSupabase.mjs`.
 */
export const PACK_COVERS_CDN_BASE =
  "https://zyqcvmjziyebiuazkggo.supabase.co/storage/v1/object/public/pack-covers";

/** Filenames in Supabase Storage — keep in sync with `src/assets/packs/` uploads. */
const PACK_COVER_CDN_FILES = [
  "151-booster-collector.webp",
  "1999-god.webp",
  "duelists-vault-cover.svg",
  "evolving-skies.webp",
  "flash.webp",
  "forbidden-rite-cover.svg",
  "gaming-tech-cover.webp",
  "infinite-apex.webp",
  "infinite-omega.webp",
  "infinite-prime.webp",
  "infinite-zenith.webp",
  "legendary-hunt.webp",
  "mega-evolution.webp",
  "midnight-grail.webp",
  "obsidian-vault.webp",
  "placeholder-pack.svg",
  "power-hour.webp",
  "prismatic-sir.webp",
  "psa-10-chaser.webp",
  "shiny-vault.webp",
  "streetwear-hype-cover.webp",
  "trainers-starter.webp",
  "waifu-vault.webp",
  "weekend-warrior.webp",
  "wotc-first-edition.webp",
  "yeezy-essentials-cover.webp",
] as const;

function cdnUrlForFilename(filename: string): string {
  return `${PACK_COVERS_CDN_BASE}/${filename}`;
}

function fileStemFromFilename(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return (dot === -1 ? filename : filename.slice(0, dot)).toLowerCase();
}

function buildCoverLookup(): Map<string, string> {
  const map = new Map<string, string>();

  for (const filename of PACK_COVER_CDN_FILES) {
    const url = cdnUrlForFilename(filename);
    const stem = fileStemFromFilename(filename);
    const withoutCover = stem.replace(/-cover$/, "");
    for (const key of [stem, withoutCover]) {
      if (key && !map.has(key)) map.set(key, url);
    }
  }

  return map;
}

const COVER_LOOKUP = buildCoverLookup();

/** Lowercase filename stem → public CDN URL. */
export const PACK_COVER_URL_BY_STEM: Record<string, string> = Object.fromEntries(
  COVER_LOOKUP.entries(),
);

export const BUNDLED_PLACEHOLDER_PACK =
  COVER_LOOKUP.get("placeholder-pack") ?? cdnUrlForFilename("placeholder-pack.svg");
