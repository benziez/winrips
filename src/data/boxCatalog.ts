import type { Pack } from "../types";
import type { StoreItem } from "../types/store";
import type { CatalogPack } from "../types/box";
import { LOBBY_PACK_CATALOG } from "../constants/packs";
import { normalizePackId } from "../constants/packIdAliases";
import { getPackStoreItems } from "../constants/catalog";
import {
  getFloorFillersForPackId,
  packFloorShareOverride,
  packGrailMaxOverride,
  packGrailMinOverride,
} from "../constants/floorFillers";
import {
  EVOLVING_SKIES_POOL,
  GOD_PACK_1999_POOL,
  LEGENDARY_HUNT_POOL,
  MEGA_EVOLUTION_POOL,
  OBSIDIAN_VAULT_POOL,
  PACK_151_POOL,
  PRISMATIC_SIR_POOL,
  PSA_10_CHASER_POOL,
  SHINY_VAULT_POOL,
  TRAINERS_STARTER_POOL,
  WAIFU_VAULT_POOL,
  WOTC_FIRST_EDITION_POOL,
  POWER_HOUR_POOL,
  MIDNIGHT_GRAIL_POOL,
  FLASH_POOL,
  WEEKEND_WARRIOR_POOL,
} from "../constants/packPokemonPools";
import {
  INFINITE_APEX_POOL,
  INFINITE_OMEGA_POOL,
  INFINITE_PRIME_POOL,
  INFINITE_ZENITH_POOL,
} from "../constants/infiniteSeriesPools";
import { gemsToUsd } from "../constants/retail";
import { resolveStoreItemImage } from "../utils/collectibleFallback";
import { applyValueScaledProbabilities } from "../utils/packProbability";
import { logger } from "../lib/logger";
import {
  applyLobbyPackCovers,
  initLobbyPackCoverMap,
} from "../constants/lobbyPackCovers";

export { applyLobbyPackCovers } from "../constants/lobbyPackCovers";
export { normalizePackId } from "../constants/packIdAliases";

/** Last-resort static pools keyed by remote + catalog ids. */
const DIRECT_STATIC_POOLS: Record<string, StoreItem[]> = {
  "trainers-starter": TRAINERS_STARTER_POOL,
  "151-booster-collector": PACK_151_POOL,
  "151-booster": PACK_151_POOL,
  "mega-evolution": MEGA_EVOLUTION_POOL,
  "legendary-hunt": LEGENDARY_HUNT_POOL,
  "prismatic-sir": PRISMATIC_SIR_POOL,
  "evolving-skies": EVOLVING_SKIES_POOL,
  "god-pack-1999": GOD_PACK_1999_POOL,
  "1999-god": GOD_PACK_1999_POOL,
  "wotc-first-edition": WOTC_FIRST_EDITION_POOL,
  "obsidian-vault": OBSIDIAN_VAULT_POOL,
  "psa-10-chaser": PSA_10_CHASER_POOL,
  "waifu-vault": WAIFU_VAULT_POOL,
  "shiny-vault": SHINY_VAULT_POOL,
  "power-hour": POWER_HOUR_POOL,
  "midnight-grail": MIDNIGHT_GRAIL_POOL,
  flash: FLASH_POOL,
  "weekend-warrior": WEEKEND_WARRIOR_POOL,
  "infinite-prime": INFINITE_PRIME_POOL,
  "infinite-apex": INFINITE_APEX_POOL,
  "infinite-zenith": INFINITE_ZENITH_POOL,
  "infinite-omega": INFINITE_OMEGA_POOL,
};

let remotePacks: CatalogPack[] | null = null;
let remoteStoreItemsByPackId: Record<string, StoreItem[]> | null = null;
let localFallbackPacks: CatalogPack[] = [];

function isPokemonLobbyPack(pack: Pack): boolean {
  return pack.category === "pokemon";
}

function filterPokemonLobbyPacks(packs: CatalogPack[]): CatalogPack[] {
  return packs.filter(isPokemonLobbyPack);
}

function mergeStoreItems(primary: StoreItem[], secondary: StoreItem[]): StoreItem[] {
  const localById = new Map(secondary.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const merged: StoreItem[] = [];

  for (const remote of primary) {
    seen.add(remote.id);
    const local = localById.get(remote.id);
    merged.push(
      local
        ? {
            ...remote,
            name: local.name,
            image: local.image?.trim() || remote.image,
            value: local.value > 0 ? local.value : remote.value,
            rarity: local.rarity,
            appRarity: local.appRarity,
          }
        : remote,
    );
  }

  for (const item of secondary) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  return merged;
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
  if (!remotePacks?.length) return localFallbackPacks;

  const remoteIds = new Set(
    remotePacks.flatMap((pack) => [pack.id, normalizePackId(pack.id)]),
  );
  const staticExtras = localFallbackPacks.filter(
    (pack) => !remoteIds.has(pack.id) && !remoteIds.has(normalizePackId(pack.id)),
  );
  return [...remotePacks, ...staticExtras];
}

export function findStaticPackById(packId: string): CatalogPack | undefined {
  const normalized = normalizePackId(packId);
  return LOBBY_PACK_CATALOG.find(
    (pack) => pack.id === normalized || pack.id === packId.trim(),
  );
}

export function findPackById(packId: string): Pack | undefined {
  const trimmed = packId.trim();
  const normalized = normalizePackId(trimmed);
  const staticPack = findStaticPackById(trimmed);
  const fromLobby = getLobbyPackCatalog().find(
    (pack) =>
      pack.id === trimmed ||
      pack.id === normalized ||
      normalizePackId(pack.id) === normalized,
  );

  if (fromLobby) {
    const staticItems = staticPack?.items ?? [];
    const lobbyResolvesItems = getPackStoreItems(fromLobby).length > 0;

    if (!lobbyResolvesItems && staticItems.length > 0) {
      return { ...fromLobby, items: staticItems };
    }
    return fromLobby;
  }

  return staticPack;
}

/** Canonical gem cost for open_pack — prefers static lobby catalog over remote box rows. */
export function resolvePackGemCost(packId: string, fallbackCost = 0): number {
  const trimmed = packId.trim();
  const normalized = normalizePackId(trimmed);
  const staticPack = LOBBY_PACK_CATALOG.find(
    (pack) => pack.id === trimmed || pack.id === normalized,
  );
  if (staticPack && staticPack.cost > 0) {
    return staticPack.cost;
  }

  const lobbyPack = findPackById(trimmed);
  if (lobbyPack && lobbyPack.cost > 0) {
    return lobbyPack.cost;
  }

  return Math.max(0, Math.round(fallbackCost));
}

function resolveDirectStaticPool(packId: string): StoreItem[] {
  const trimmed = packId.trim();
  const normalized = normalizePackId(trimmed);
  const pool =
    DIRECT_STATIC_POOLS[trimmed] ??
    DIRECT_STATIC_POOLS[normalized];
  if (!pool?.length) return [];

  const pack = findStaticPackById(trimmed) ?? findPackById(trimmed);
  return applyValueScaledProbabilities([...pool], {
    spinCost: pack?.cost ?? 100,
    packId: pack?.id ?? trimmed,
    floorShare: packFloorShareOverride(pack?.id ?? trimmed),
    grailMaxProbability: packGrailMaxOverride(pack?.id ?? trimmed),
    grailMinProbability: packGrailMinOverride(pack?.id ?? trimmed),
  });
}

function resolveStaticCatalogItems(packId: string): StoreItem[] {
  const staticPack = findStaticPackById(packId);
  if (!staticPack) return resolveDirectStaticPool(packId);

  const fromCatalog = getPackStoreItems(staticPack);
  return fromCatalog.length > 0 ? fromCatalog : resolveDirectStaticPool(packId);
}

function isRemoteCatalogPack(packId: string): boolean {
  if (!remoteStoreItemsByPackId || !remotePacks?.length) return false;
  const normalized = normalizePackId(packId);
  return remotePacks.some(
    (entry) =>
      entry.id === packId ||
      entry.id === normalized ||
      normalizePackId(entry.id) === normalized,
  );
}

export function getRemoteBoxStoreItems(packId: string): StoreItem[] {
  if (!remoteStoreItemsByPackId) return [];
  const normalized = normalizePackId(packId);
  return (
    remoteStoreItemsByPackId[packId] ??
    remoteStoreItemsByPackId[normalized] ??
    []
  );
}

/**
 * Single roll-pool source for RNG rolls and reveal lookup.
 * Merges remote DB rows with static catalog so partial Supabase seeds cannot desync rolls.
 */
export function getPackStoreItemsForPack(pack: Pack): StoreItem[] {
  const normalizedId = normalizePackId(pack.id);
  const staticFromPack = getPackStoreItems(pack);
  const staticPool =
    staticFromPack.length > 0 ? staticFromPack : resolveStaticCatalogItems(pack.id);

  if (isRemoteCatalogPack(pack.id)) {
    const remote = getRemoteBoxStoreItems(pack.id);
    if (remote.length === 0) {
      return staticPool;
    }

    const mergedCore = mergeStoreItems(remote, staticPool);
    const floorFillers = getFloorFillersForPackId(normalizedId);
    const seen = new Set(mergedCore.map((item) => item.id));
    const merged = [
      ...mergedCore,
      ...floorFillers.filter((item) => !seen.has(item.id)),
    ];
    return applyValueScaledProbabilities(merged, {
      spinCost: pack.cost,
      packId: pack.id,
      floorShare: packFloorShareOverride(pack.id),
      grailMaxProbability: packGrailMaxOverride(pack.id),
      grailMinProbability: packGrailMinOverride(pack.id),
    });
  }

  return staticPool;
}

/** Roll pool by pack id — used by RNG, drop table, and card resolution. */
export function getPackRollPool(packId: string): StoreItem[] {
  const trimmed = packId.trim();
  if (!trimmed) return [];

  const candidates = [trimmed, normalizePackId(trimmed)];
  const seen = new Set<string>();

  for (const id of candidates) {
    if (seen.has(id)) continue;
    seen.add(id);

    const pack = findPackById(id);
    if (pack) {
      const pool = getPackStoreItemsForPack(pack);
      if (pool.length > 0) return pool;
    }

    const staticPool = resolveStaticCatalogItems(id);
    if (staticPool.length > 0) return staticPool;
  }

  logger.warn("[getPackRollPool] pack not found", { packId: trimmed });
  return [];
}

/** Synchronous drop-table source — never waits on remote catalog fetch. */
export function resolveDropTableItems(packId: string): StoreItem[] {
  return getPackRollPool(packId);
}

/**
 * Best-guess pack for a catalog item among pools that contain it.
 * Cheap cards → cheapest pack; mid value → middle-cost pack; grails → highest-cost pack.
 */
export function findPackForCatalogItemId(
  itemId: string,
  valueGems?: number,
): Pack | undefined {
  const normalized = itemId.trim();
  if (!normalized) return undefined;

  const candidates: Pack[] = [];
  for (const pack of getLobbyPackCatalog()) {
    const pool = getPackRollPool(pack.id);
    if (pool.some((entry) => entry.id === normalized)) {
      candidates.push(pack);
    }
  }

  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  candidates.sort((a, b) => a.cost - b.cost);

  let gems = valueGems;
  if (gems == null || !Number.isFinite(gems)) {
    for (const pack of candidates) {
      const entry = getPackRollPool(pack.id).find((item) => item.id === normalized);
      if (entry) {
        gems = entry.value;
        break;
      }
    }
  }

  const usd = gems != null && Number.isFinite(gems) ? gemsToUsd(gems) : 0;

  if (usd < 50) {
    return candidates[0];
  }
  if (usd < 200) {
    return candidates[Math.floor((candidates.length - 1) / 2)]!;
  }
  return candidates[candidates.length - 1]!;
}

/** Catalog art for a pull when vault_items.image_url is empty or stale. */
export function findCatalogItemImageUrl(itemId: string): string {
  const normalized = itemId.trim();
  if (!normalized) return "";

  for (const pack of getLobbyPackCatalog()) {
    const entry = getPackRollPool(pack.id).find((item) => item.id === normalized);
    const image = resolveStoreItemImage(entry ?? {});
    if (image) return image;
  }

  return "";
}

/** Storefront tier (Common → Mythic) for a catalog item id. */
export function findCatalogItemStoreRarity(itemId: string): StoreItem["rarity"] {
  const normalized = itemId.trim();
  if (!normalized) return "Common";

  for (const pack of getLobbyPackCatalog()) {
    const entry = getPackRollPool(pack.id).find((item) => item.id === normalized);
    if (entry) return entry.rarity;
  }

  return "Common";
}
