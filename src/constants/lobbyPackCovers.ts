import type { Pack } from "../types";
import { BUNDLED_PACK_COVERS, BUNDLED_PLACEHOLDER_PACK } from "../assets/packCoverMap";

/** Lobby box art for Supabase `public.boxes` ids — Vite-bundled URLs. */
export const LOBBY_BOX_COVER_ASSETS: Record<string, string> = {
  ...BUNDLED_PACK_COVERS,
};

export { BUNDLED_PLACEHOLDER_PACK };

const legacyPackCoverById: Record<string, string> = {};

export function initLobbyPackCoverMap(packs: readonly Pick<Pack, "id" | "image">[]): void {
  for (const pack of packs) {
    if (!LOBBY_BOX_COVER_ASSETS[pack.id]) {
      legacyPackCoverById[pack.id] = pack.image;
    }
  }
}

export function resolveLobbyPackCover(packId: string, dbImageUrl?: string): string {
  return (
    LOBBY_BOX_COVER_ASSETS[packId] ??
    legacyPackCoverById[packId] ??
    dbImageUrl ??
    BUNDLED_PLACEHOLDER_PACK
  );
}

export function applyLobbyPackCovers<T extends Pack>(packs: T[]): T[] {
  return packs.map((pack) => {
    const cover = resolveLobbyPackCover(pack.id, pack.image);
    return cover ? { ...pack, image: cover } : pack;
  });
}
