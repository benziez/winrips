/** Local sports collectible art — never hotlink external hosts. */
export const SPORTS_PLACEHOLDER_IMAGE = "/images/sports-placeholder.png";

export function isSportsPlaceholderImage(src?: string | null): boolean {
  return src === SPORTS_PLACEHOLDER_IMAGE;
}
