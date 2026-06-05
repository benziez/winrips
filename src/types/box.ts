import type { Pack } from "./index";
import type { StoreItem } from "./store";

export interface BoxRow {
  id: string;
  name: string;
  cost: number;
  description: string | null;
  category: string;
  image_url: string;
  theme: string | null;
  accent_label: string | null;
  ribbon: string | null;
  visual: string | null;
  is_active: boolean;
  sort_order: number;
  daily_limit: number | null;
  opens_today: number;
}

export interface BoxItemRow {
  id: string;
  box_id: string;
  item_id: string;
  item_name: string;
  store_rarity: string;
  gem_value: number;
  image_url: string;
  probability: number;
  sort_order: number;
}

export interface CatalogPack extends Pack {
  items: string[];
}

export type BoxStoreItemsMap = Record<string, StoreItem[]>;
