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
          is_admin?: boolean | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      battles: {
        Row: {
          id: string;
          status: string;
          box_ids: string[];
          entry_cost: number;
          winner_id: string | null;
          created_at: string;
          results?: Json | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      battle_participants: {
        Row: {
          id: string;
          battle_id: string;
          user_id: string;
          position: number;
          total_pulled_value: number;
          joined_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      battle_pulls: {
        Row: {
          id: string;
          battle_id: string;
          participant_id: string;
          user_id: string;
          box_id: string;
          item_id: string;
          item_name: string;
          store_rarity: string | null;
          gem_value: number;
          image_url: string;
          pull_index: number;
          created_at: string;
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
      add_to_vault: {
        Args: {
          p_user_id: string;
          p_item_id: string;
          p_item_name: string;
          p_gem_value: number;
          p_image_url: string;
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
      exchange_vault_item: {
        Args: {
          p_item_id: string;
        };
        Returns: Json;
      };
      fetch_pending_shipments_admin: {
        Args: Record<string, never>;
        Returns: Json;
      };
      mark_vault_item_shipped: {
        Args: {
          p_item_id: string;
          p_tracking_number: string;
        };
        Returns: Json;
      };
      process_upgrade_roll: {
        Args: {
          p_input_item_id: string;
          p_target_catalog_id: string;
        };
        Returns: Json;
      };
      create_battle: {
        Args: {
          p_box_ids: string[];
        };
        Returns: Json;
      };
      join_battle: {
        Args: {
          p_battle_id: string;
        };
        Returns: Json;
      };
      resolve_battle: {
        Args: {
          p_battle_id: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
