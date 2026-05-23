/**
 * Supabase schema bindings — extend when new tables are added.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface PlayHistoryRow {
  id: string;
  user_id: string;
  pack_name: string;
  spin_cost: number;
  won_item_name: string;
  won_item_value: number;
  won_item_image: string;
  rolled_number: number;
  created_at: string;
}

export interface PlayHistoryInsert {
  user_id: string;
  pack_name: string;
  spin_cost: number;
  won_item_name: string;
  won_item_value: number;
  won_item_image: string;
  rolled_number: number;
}

export interface VaultItemRow {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  rarity: string;
  gem_value: number;
  image_url: string;
  created_at: string;
  status?: string;
  shipping_name?: string | null;
  shipping_address?: string | null;
  tracking_number?: string | null;
}

export interface VaultItemInsert {
  user_id: string;
  item_id: string;
  item_name: string;
  rarity: string;
  gem_value: number;
  image_url: string;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      vault_items: {
        Row: VaultItemRow;
        Insert: VaultItemInsert;
        Update: Partial<VaultItemInsert>;
        Relationships: [];
      };
      play_history: {
        Row: PlayHistoryRow;
        Insert: PlayHistoryInsert;
        Update: Partial<PlayHistoryInsert>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          gems_balance: number | null;
          username: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      process_spin_transaction: {
        Args: {
          p_user_id: string;
          p_spin_cost: number;
        };
        Returns: Json;
      };
      process_shipping_request: {
        Args: {
          p_item_id: string;
          p_shipping_cost: number;
          p_name: string;
          p_address: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
