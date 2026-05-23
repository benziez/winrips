import type { Pack } from "../types";
import { YUGIOH_LOBBY_COVERS } from "./yugiohAssets";

/** Lobby box art for Supabase `public.boxes` ids — separate from `box_items` product shots. */
export const LOBBY_BOX_COVER_ASSETS: Record<string, string> = {
  "trainers-starter": "/images/packs/trainers-starter-cover.png",
  "151-booster": "/images/packs/151-booster-cover.png",
  "legendary-hunt": "/images/packs/legendary-hunt-cover.png",
  "1999-god": "/images/packs/1999-god-cover.png",
  ...YUGIOH_LOBBY_COVERS,
};

const legacyPackCoverById: Record<string, string> = {};

export function initLobbyPackCoverMap(packs: readonly Pick<Pack, "id" | "image">[]): void {
  for (const pack of packs) {
    if (!LOBBY_BOX_COVER_ASSETS[pack.id]) {
      legacyPackCoverById[pack.id] = pack.image;
    }
  }
}

export function resolveLobbyPackCover(packId: string, dbImageUrl?: string): string {
  return LOBBY_BOX_COVER_ASSETS[packId] ?? legacyPackCoverById[packId] ?? dbImageUrl ?? "";
}

export function applyLobbyPackCovers<T extends Pack>(packs: T[]): T[] {
  return packs.map((pack) => {
    const cover = resolveLobbyPackCover(pack.id, pack.image);
    return cover ? { ...pack, image: cover } : pack;
  });
}
