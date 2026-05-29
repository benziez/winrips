export type Rarity = "Common" | "Rare" | "Ancient Rare";

export type Currency = "gold-volts" | "sweeps-cash";

export type PackTheme = "gold" | "fuchsia" | "mystic";

export type PackCategory = "pokemon" | "ufc" | "nba" | "nfl" | "mlb" | "yugioh";

export type PackVisual = "default" | "ufc-octagon" | "nba-hardwood";

export type LobbyCategoryFilter = "all" | PackCategory;

export type AppView =
  | "lobby"
  | "pack-open"
  | "inventory"
  | "vault"
  | "play-history"
  | "upgrader"
  | "battles"
  | "battle-arena"
  | "leaderboard"
  | "showroom"
  | "account"
  | "settings"
  | "refer"
  | "rewards"
  | "fairness"
  | "help-desk"
  | "self-exclusion"
  | "admin";

export type AuthModalMode = "login" | "signup";

export interface Pack {
  id: string;
  name: string;
  cost: number;
  theme: PackTheme;
  description: string;
  category: PackCategory;
  /** Pack cover — local path (/images/...) or absolute URL */
  image: string;
  /** Card IDs in this pack's drop pool (seeded Pokémon catalog) */
  items?: string[];
  visual?: PackVisual;
  /** Corner ribbon tag, e.g. "100x Potential" */
  ribbon?: string;
  /** Diagonal top-corner accent, e.g. "1,000x CEILING" */
  accentLabel?: string;
}

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
  /** Card art — local path (/images/...) or absolute URL */
  image: string;
}

export interface RecentDrop {
  id: string;
  username: string;
  item: string;
  rarity: Rarity;
  avatar: string;
}

export interface PulledCard extends Card {
  packId: string;
}

export type VaultItemStatus =
  | "vaulted"
  | "pending_shipment"
  | "shipped"
  | "delivered"
  | "exchanged"
  | "upgraded_lost";

export interface VaultedCard extends Card {
  vaultId: string;
  acquiredAt: string;
  status?: VaultItemStatus;
  shippingName?: string;
  shippingAddress?: string;
  trackingNumber?: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  volume: number;
  pulls: number;
  isGold?: boolean;
}
