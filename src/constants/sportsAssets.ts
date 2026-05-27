/** Local sports card back — never hotlink Pokémon CDN for NBA/NFL/MLB. */
export const SPORTS_PLACEHOLDER_IMAGE = "images/sports-placeholder.png";

/** Grey luxury card-back used when sports imagery fails to load. */
export const SPORTS_CARD_BACK_FALLBACK = "/card-back.svg";

export function isSportsPlaceholderImage(src?: string | null): boolean {
  return src === SPORTS_PLACEHOLDER_IMAGE;
}

export function isSportsCategory(category?: string): boolean {
  return category === "nba" || category === "nfl" || category === "mlb";
}
