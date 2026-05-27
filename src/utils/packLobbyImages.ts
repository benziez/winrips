import { CARD_PLACEHOLDER_IMAGE } from "../constants/cardAssets";
import { getPackStoreItems } from "../constants/catalog";
import { LOBBY_BOX_COVER_ASSETS } from "../constants/lobbyPackCovers";
import { findStaticPackById, normalizePackId } from "../data/boxCatalog";
import type { Pack } from "../types";

/** Lobby tile cover when DB / remote art is missing. */
export function resolvePackLobbyCover(packId: string, packImage?: string | null): string {
  const trimmed = packImage?.trim();
  if (trimmed) return trimmed;

  const normalized = normalizePackId(packId);
  const coverAsset =
    LOBBY_BOX_COVER_ASSETS[packId] ??
    LOBBY_BOX_COVER_ASSETS[normalized];
  if (coverAsset?.trim()) return coverAsset;

  const staticPack = findStaticPackById(packId);
  if (staticPack?.image?.trim()) return staticPack.image;

  if (staticPack) {
    const topItem = [...getPackStoreItems(staticPack)].sort((a, b) => b.value - a.value)[0];
    if (topItem?.image?.trim()) return topItem.image;
  }

  return CARD_PLACEHOLDER_IMAGE;
}

/** Ensures lobby autoplay always has at least one renderable image URL. */
export function resolvePackCycleSlides(
  packId: string,
  pack: Pack,
  cycleSlides: readonly string[],
): string[] {
  const urls = cycleSlides.map((url) => url?.trim()).filter(Boolean) as string[];
  if (urls.length > 0) return urls;
  return [resolvePackLobbyCover(packId, pack.image)];
}
