import { BUNDLED_PACK_COVERS, BUNDLED_PLACEHOLDER_PACK } from "../assets/packCoverMap";

/** Yu-Gi-Oh! TCG card back — used when YGO art URLs fail (never Pokémon back). */
export const YUGIOH_CARD_BACK_FALLBACK = "images/yugioh-card-back.svg";

/** Local lobby box art for Yu-Gi-Oh packs (bundled where available). */
export const YUGIOH_LOBBY_COVERS: Record<string, string> = {
  "duelists-vault": BUNDLED_PACK_COVERS["duelists-vault"]!,
  "forbidden-rite": BUNDLED_PACK_COVERS["forbidden-rite"]!,
  "duelist-starter-cache": BUNDLED_PLACEHOLDER_PACK,
  "legacy-collection-raid": BUNDLED_PLACEHOLDER_PACK,
  "shadow-rare-hunt": BUNDLED_PLACEHOLDER_PACK,
  "toon-chaos-edition": BUNDLED_PLACEHOLDER_PACK,
  "exodia-chase-protocol": BUNDLED_PLACEHOLDER_PACK,
  "millennium-tin-premium": BUNDLED_PLACEHOLDER_PACK,
};

export function yugiohLobbyCover(packId: string): string {
  return YUGIOH_LOBBY_COVERS[packId] ?? BUNDLED_PLACEHOLDER_PACK;
}

export function isYugiohAssetUrl(src?: string | null): boolean {
  if (!src?.trim()) return false;
  const normalized = src.replace(/^\//, "");
  return (
    src.includes("ygoprodeck.com") ||
    normalized.includes("duelists-vault") ||
    normalized.includes("forbidden-rite") ||
    normalized.startsWith("images/yugioh-")
  );
}

export function isPokemonAssetUrl(src?: string | null): boolean {
  if (!src?.trim()) return false;
  return src.includes("pokemontcg.io");
}
