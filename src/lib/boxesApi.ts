import type { PackCategory, PackTheme, PackVisual, Rarity } from "../types";
import type { StoreItem, StoreRarity } from "../types/store";
import type { BoxItemRow, BoxRow, CatalogPack } from "../types/box";
import { resolveLobbyPackCover } from "../constants/lobbyPackCovers";
import { isCollectiblePokemonStoreItem } from "../lib/pokemonApi";
import { sanitizeStoreItemImage } from "../utils/collectibleFallback";
import { supabase } from "./supabaseClient";

const VALID_CATEGORIES: PackCategory[] = [
  "pokemon",
  "nba",
  "nfl",
  "mlb",
  "ufc",
  "yugioh",
];

const VALID_THEMES: PackTheme[] = ["gold", "fuchsia", "mystic"];
const VALID_VISUALS: PackVisual[] = ["default", "ufc-octagon", "nba-hardwood"];

const EXCLUDED_BOX_CATEGORIES = new Set([
  "sneakers",
  "streetwear",
  "gaming",
  "general",
]);

function asPackCategory(value: string): PackCategory {
  return VALID_CATEGORIES.includes(value as PackCategory)
    ? (value as PackCategory)
    : "pokemon";
}

function asPackTheme(value: string | null): PackTheme {
  return value && VALID_THEMES.includes(value as PackTheme) ? (value as PackTheme) : "gold";
}

function asPackVisual(value: string | null): PackVisual | undefined {
  return value && VALID_VISUALS.includes(value as PackVisual) ? (value as PackVisual) : undefined;
}

function asStoreRarity(value: string): StoreRarity {
  const normalized = value.trim();
  if (
    normalized === "Mythic" ||
    normalized === "Legendary" ||
    normalized === "Epic" ||
    normalized === "Rare" ||
    normalized === "Common"
  ) {
    return normalized;
  }
  return "Common";
}

function storeRarityToAppRarity(rarity: StoreRarity): Rarity {
  if (rarity === "Mythic" || rarity === "Legendary") return "Ancient Rare";
  if (rarity === "Epic" || rarity === "Rare") return "Rare";
  return "Common";
}

function mapBoxRow(row: Record<string, unknown>): BoxRow {
  return {
    id: String(row.id),
    name: String(row.name),
    cost: Number(row.cost ?? 0),
    description: row.description != null ? String(row.description) : null,
    category: String(row.category ?? "general"),
    image_url: String(row.image_url),
    theme: row.theme != null ? String(row.theme) : null,
    accent_label: row.accent_label != null ? String(row.accent_label) : null,
    ribbon: row.ribbon != null ? String(row.ribbon) : null,
    visual: row.visual != null ? String(row.visual) : null,
    is_active: Boolean(row.is_active ?? true),
    sort_order: Number(row.sort_order ?? 0),
  };
}

function mapBoxItemRow(row: Record<string, unknown>): BoxItemRow {
  return {
    id: String(row.id),
    box_id: String(row.box_id),
    item_id: String(row.item_id),
    item_name: String(row.item_name),
    store_rarity: String(row.store_rarity ?? "Common"),
    gem_value: Number(row.gem_value ?? 0),
    image_url: String(row.image_url),
    probability: Number(row.probability ?? 0),
    sort_order: Number(row.sort_order ?? 0),
  };
}

export function boxItemRowToStoreItem(row: BoxItemRow, category: PackCategory): StoreItem | null {
  const storeRarity = asStoreRarity(row.store_rarity);
  const image = sanitizeStoreItemImage(row.image_url, category, row.item_id);
  const item: StoreItem = {
    id: row.item_id,
    name: row.item_name,
    rarity: storeRarity,
    appRarity: storeRarityToAppRarity(storeRarity),
    value: row.gem_value,
    image,
    probability: row.probability,
    tcgMarketUsd: 0,
    setId: category,
    setName: category,
    number: "",
  };

  if (category === "pokemon" && !isCollectiblePokemonStoreItem(item)) {
    return null;
  }

  return item;
}

export function boxRowToCatalogPack(row: BoxRow, itemIds: string[]): CatalogPack {
  return {
    id: row.id,
    name: row.name,
    cost: row.cost,
    theme: asPackTheme(row.theme),
    description: row.description ?? "",
    category: asPackCategory(row.category),
    image: resolveLobbyPackCover(row.id, row.image_url),
    items: itemIds,
    visual: asPackVisual(row.visual),
    ribbon: row.ribbon ?? undefined,
    accentLabel: row.accent_label ?? undefined,
  };
}

export interface RemoteBoxCatalog {
  packs: CatalogPack[];
  storeItemsByPackId: Record<string, StoreItem[]>;
}

export async function fetchRemoteBoxCatalog(): Promise<RemoteBoxCatalog | null> {
  if (!supabase) return null;

  const { data: boxes, error: boxesError } = await supabase
    .from("boxes")
    .select(
      "id, name, cost, description, category, image_url, theme, accent_label, ribbon, visual, is_active, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("cost", { ascending: true })
    .limit(1000);

  if (boxesError) {
    console.error("[boxes] fetch boxes", boxesError.message);
    return null;
  }

  const boxRows = (boxes ?? []) as Record<string, unknown>[];
  if (!boxRows.length) return { packs: [], storeItemsByPackId: {} };

  const boxIds = boxRows.map((row) => String(row.id));

  const { data: items, error: itemsError } = await supabase
    .from("box_items")
    .select(
      "id, box_id, item_id, item_name, store_rarity, gem_value, image_url, probability, sort_order",
    )
    .in("box_id", boxIds)
    .order("sort_order", { ascending: true })
    .limit(10000);

  if (itemsError) {
    console.error("[boxes] fetch box_items", itemsError.message);
    return null;
  }

  const storeItemsByPackId: Record<string, StoreItem[]> = {};
  const itemIdsByPack: Record<string, string[]> = {};

  for (const raw of items ?? []) {
    const row = mapBoxItemRow(raw as Record<string, unknown>);
    const box = boxRows.find((entry) => String(entry.id) === row.box_id);
    const category = asPackCategory(String(box?.category ?? "general"));
    const storeItem = boxItemRowToStoreItem(row, category);
    if (!storeItem) continue;

    if (!storeItemsByPackId[row.box_id]) {
      storeItemsByPackId[row.box_id] = [];
      itemIdsByPack[row.box_id] = [];
    }
    storeItemsByPackId[row.box_id].push(storeItem);
    itemIdsByPack[row.box_id].push(row.item_id);
  }

  for (const raw of boxRows) {
    const boxId = String(raw.id);
    if (!storeItemsByPackId[boxId]) {
      storeItemsByPackId[boxId] = [];
      itemIdsByPack[boxId] = [];
    }
  }

  const packs = boxRows
    .filter((raw) => !EXCLUDED_BOX_CATEGORIES.has(String(raw.category ?? "")))
    .filter((raw) => asPackCategory(String(raw.category ?? "")) === "pokemon")
    .map((raw) => {
      const row = mapBoxRow(raw as Record<string, unknown>);
      return boxRowToCatalogPack(row, itemIdsByPack[row.id] ?? []);
    });

  return { packs, storeItemsByPackId };
}
