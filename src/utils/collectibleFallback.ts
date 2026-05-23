import type { PackCategory } from "../types";
import { POKEMON_CARD_BACK_FALLBACK } from "../constants/pokemonAssets";
import {
  hasHighResCollectibleImage,
} from "../lib/pokemonApi";
import {
  isPokemonAssetUrl,
  isYugiohAssetUrl,
  YUGIOH_CARD_BACK_FALLBACK,
} from "../constants/yugiohAssets";
import { YUGIOH_POOL } from "../constants/categoryPools";

type ImageSource = {
  id?: string;
  image?: string;
  image_url?: string;
};

/** Normalizes `image` / `image_url` from catalog or remote box rows. */
export function resolveStoreItemImage(item: ImageSource): string {
  return (item.image_url ?? item.image)?.trim() ?? "";
}

export function resolveCardBackFallback(
  src?: string | null,
  category?: PackCategory,
): string {
  if (category === "yugioh" || isYugiohAssetUrl(src)) {
    return YUGIOH_CARD_BACK_FALLBACK;
  }
  return POKEMON_CARD_BACK_FALLBACK;
}

/** Repair Yu-Gi-Oh item/box URLs that incorrectly point at Pokémon CDN assets. */
export function resolveYugiohStoreImage(
  imageUrl: string | undefined | null,
  itemId?: string,
): string {
  const trimmed = imageUrl?.trim() ?? "";
  const polluted =
    !trimmed ||
    isPokemonAssetUrl(trimmed) ||
    trimmed.includes("/back.png") ||
    trimmed.includes("/back.jpg");

  if (!polluted) return trimmed;

  if (itemId) {
    const local = YUGIOH_POOL.find((item) => item.id === itemId);
    if (local?.image?.trim()) return local.image;
  }

  return YUGIOH_CARD_BACK_FALLBACK;
}

export function sanitizeStoreItemImage(
  imageUrl: string | undefined | null,
  category: PackCategory,
  itemId?: string,
): string {
  if (category === "yugioh") {
    return resolveYugiohStoreImage(imageUrl, itemId);
  }
  if (category === "pokemon") {
    const trimmed = imageUrl?.trim() ?? "";
    if (hasHighResCollectibleImage(trimmed)) return trimmed;
    return "";
  }
  return imageUrl?.trim() ?? "";
}
