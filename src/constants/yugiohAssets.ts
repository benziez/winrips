/** Yu-Gi-Oh! TCG card back — used when YGO art URLs fail (never Pokémon back). */
export const YUGIOH_CARD_BACK_FALLBACK = "/images/yugioh-card-back.svg";

const YUGIOH_PACK_PLACEHOLDER = "/images/placeholder-pack.svg";

/** Local lobby box art for Yu-Gi-Oh packs (no hotlink / cross-category bleed). */
export const YUGIOH_LOBBY_COVERS: Record<string, string> = {
  "duelists-vault": "/images/packs/duelists-vault-cover.svg",
  "forbidden-rite": "/images/packs/forbidden-rite-cover.svg",
  "duelist-starter-cache": YUGIOH_PACK_PLACEHOLDER,
  "legacy-collection-raid": YUGIOH_PACK_PLACEHOLDER,
  "shadow-rare-hunt": YUGIOH_PACK_PLACEHOLDER,
  "toon-chaos-edition": YUGIOH_PACK_PLACEHOLDER,
  "exodia-chase-protocol": YUGIOH_PACK_PLACEHOLDER,
  "millennium-tin-premium": YUGIOH_PACK_PLACEHOLDER,
};

export function yugiohLobbyCover(packId: string): string {
  return YUGIOH_LOBBY_COVERS[packId] ?? YUGIOH_PACK_PLACEHOLDER;
}

export function isYugiohAssetUrl(src?: string | null): boolean {
  if (!src?.trim()) return false;
  return (
    src.includes("ygoprodeck.com") ||
    src.startsWith("/images/packs/duelists-vault") ||
    src.startsWith("/images/packs/forbidden-rite") ||
    src.startsWith("/images/yugioh-")
  );
}

export function isPokemonAssetUrl(src?: string | null): boolean {
  if (!src?.trim()) return false;
  return src.includes("pokemontcg.io");
}
