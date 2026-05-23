import type { Pack } from "../types";
import type { StoreItem } from "../types/store";
import type { CatalogPack } from "../types/box";
import { getPackStoreItems } from "../constants/catalog";
import { getFloorFillersForPackId } from "../constants/floorFillers";
import { applyValueScaledProbabilities } from "../utils/packProbability";
import {
  applyLobbyPackCovers,
  initLobbyPackCoverMap,
} from "../constants/lobbyPackCovers";

export { applyLobbyPackCovers } from "../constants/lobbyPackCovers";

let remotePacks: CatalogPack[] | null = null;
let remoteStoreItemsByPackId: Record<string, StoreItem[]> | null = null;
let localFallbackPacks: CatalogPack[] = [];

function isPokemonLobbyPack(pack: Pack): boolean {
  return pack.category === "pokemon";
}

function filterPokemonLobbyPacks(packs: CatalogPack[]): CatalogPack[] {
  return packs.filter(isPokemonLobbyPack);
}

export function initBoxCatalogFallback(packs: CatalogPack[]): void {
  localFallbackPacks = filterPokemonLobbyPacks(packs);
  initLobbyPackCoverMap(localFallbackPacks);
}

export function setRemoteBoxCatalog(
  packs: CatalogPack[],
  storeItemsByPackId: Record<string, StoreItem[]>,
): void {
  const pokemonPacks = filterPokemonLobbyPacks(packs);
  remotePacks = applyLobbyPackCovers(pokemonPacks);
  remoteStoreItemsByPackId = Object.fromEntries(
    pokemonPacks.map((pack) => [pack.id, storeItemsByPackId[pack.id] ?? []]),
  );
}

export function clearRemoteBoxCatalog(): void {
  remotePacks = null;
  remoteStoreItemsByPackId = null;
}

export function hasRemoteBoxCatalog(): boolean {
  return Boolean(remotePacks?.length);
}

export function getLobbyPackCatalog(): CatalogPack[] {
  if (remotePacks?.length) return remotePacks;
  return localFallbackPacks;
}

export function findPackById(packId: string): Pack | undefined {
  return getLobbyPackCatalog().find((pack) => pack.id === packId);
}

export function getRemoteBoxStoreItems(packId: string): StoreItem[] {
  if (!remoteStoreItemsByPackId) return [];
  return remoteStoreItemsByPackId[packId] ?? [];
}

export function getPackStoreItemsForPack(pack: Pack): StoreItem[] {
  if (remoteStoreItemsByPackId && remotePacks?.some((entry) => entry.id === pack.id)) {
    const remote = getRemoteBoxStoreItems(pack.id);
    if (remote.length === 0) {
      return getPackStoreItems(pack);
    }
    const floorFillers = getFloorFillersForPackId(pack.id);
    const seen = new Set(remote.map((item) => item.id));
    const merged = [...remote, ...floorFillers.filter((item) => !seen.has(item.id))];
    return applyValueScaledProbabilities(merged, { spinCost: pack.cost });
  }
  return getPackStoreItems(pack);
}
