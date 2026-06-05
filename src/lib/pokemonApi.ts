import type { StoreItem } from "../types/store";

/** Pokémon TCG API card shape (subset used for filtering). */
export interface PokemonTcgApiCard {
  name?: string;
  supertype?: string;
  images?: {
    large?: string;
    small?: string;
  };
}

const BLOCKED_NAME_PATTERNS = [
  /code card/i,
  /\benergy\b/i,
  /\bbasic energy\b/i,
  /\bspecial energy\b/i,
];

/**
 * Strict storefront gate — only true Pokémon cards with large/hires artwork.
 * Excludes Trainers, Energy, Code Cards, and assets missing high-res images.
 */
export function isCollectiblePokemonApiCard(card: PokemonTcgApiCard): boolean {
  if (card.supertype !== "Pokémon") return false;

  const name = card.name?.trim() ?? "";
  if (!name || BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(name))) {
    return false;
  }

  const large = card.images?.large?.trim();
  if (!large) return false;

  return true;
}

export function resolvePokemonLargeImage(card: PokemonTcgApiCard): string | null {
  if (!isCollectiblePokemonApiCard(card)) return null;
  return card.images!.large!.trim();
}

export function hasHighResCollectibleImage(image?: string | null): boolean {
  const url = image?.trim() ?? "";
  if (!url) return false;

  if (url.includes("placeholder")) return false;
  if (url.includes("/back.png") || url.includes("/back.jpg")) return false;

  if (url.includes("pokemontcg.io")) {
    if (url.includes("/back.png") || url.includes("/back.jpg")) return false;
    // Standard (.png) and hires assets from the official Pokémon TCG CDN.
    return /\.png(\?|$)/i.test(url) || url.includes("_hires");
  }

  return url.startsWith("https://") || url.startsWith("http://");
}

/** Runtime guard for catalog rows entering MOCK_ITEMS / drop pools. */
export function isCollectiblePokemonStoreItem(
  item: Pick<StoreItem, "name" | "image">,
): boolean {
  const name = item.name?.trim() ?? "";
  if (!name || BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(name))) {
    return false;
  }

  return hasHighResCollectibleImage(item.image);
}

export function filterCollectiblePokemonApiCards<T extends PokemonTcgApiCard>(
  cards: readonly T[],
): T[] {
  return cards.filter(isCollectiblePokemonApiCard);
}

export function filterCollectiblePokemonStoreItems<T extends StoreItem>(
  items: readonly T[],
): T[] {
  return items.filter(isCollectiblePokemonStoreItem);
}
