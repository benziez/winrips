/**
 * Raw Vite-bundled pack cover URLs keyed by lowercase filename stem.
 * No catalog imports — mapping to pack ids lives in `packCoverMap.ts`.
 */
const packCoverModules = import.meta.glob<string>("./packs/*.{png,jpg,jpeg,svg,PNG,JPG,JPEG,SVG}", {
  eager: true,
  query: "?url",
  import: "default",
});

function fileStemFromModulePath(modulePath: string): string {
  const filename = modulePath.split("/").pop() ?? modulePath;
  const dot = filename.lastIndexOf(".");
  return (dot === -1 ? filename : filename.slice(0, dot)).toLowerCase();
}

function buildCoverLookup(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [modulePath, url] of Object.entries(packCoverModules)) {
    if (!url) continue;
    const stem = fileStemFromModulePath(modulePath);
    const withoutCover = stem.replace(/-cover$/, "");
    for (const key of [stem, withoutCover]) {
      if (key && !map.has(key)) map.set(key, url);
    }
  }
  return map;
}

const COVER_LOOKUP = buildCoverLookup();

/** Lowercase filename stem → hashed asset URL from `import.meta.glob`. */
export const PACK_COVER_URL_BY_STEM: Record<string, string> = Object.fromEntries(
  COVER_LOOKUP.entries(),
);

export const BUNDLED_PLACEHOLDER_PACK =
  COVER_LOOKUP.get("placeholder-pack") ?? Object.values(PACK_COVER_URL_BY_STEM)[0] ?? "";
