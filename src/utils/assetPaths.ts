/** Public URL for a card asset (PNG, JPG, SVG, or remote URL). */
export function cardImagePath(slug: string, ext = "png"): string {
  return `images/cards/${slug}.${ext}`;
}

/** Public URL for a pack cover asset. */
export function packImagePath(slug: string, ext = "png"): string {
  return `images/packs/${slug}.${ext}`;
}
