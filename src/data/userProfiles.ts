import type { Card } from "../types";
import { COLLECTOR_TOP_PULLS } from "../constants/collectorTopPulls";

/** Visible usernames for live bets (excludes Hidden — applied by engine). */
export const VISIBLE_BET_USERS = [
  "CryptoKing",
  "VoltHunter",
  "SweepQueen",
  "NeonWolf",
  "0xRipper",
  "VaultLord",
  "DropFiend",
  "MoonRider",
  "GrailHunter",
] as const;

export type VisibleBetUser = (typeof VISIBLE_BET_USERS)[number];

export interface UserProfile {
  username: string;
  avatar: string;
  joinedDate: string;
  tier: string;
  vaultPublic: boolean;
  topPulls: Card[];
}

const AVATARS: Record<string, string> = {
  VaultHunter: "🏆",
  CryptoKing: "🦊",
  VoltHunter: "⚡",
  SweepQueen: "👸",
  NeonWolf: "🐺",
  "0xApe": "🦍",
  "0xRipper": "🦍",
  VaultLord: "👹",
  DropFiend: "😈",
  DropLord: "👹",
  MoonRider: "🌙",
  GrailHunter: "🐲",
  PackFiend: "📦",
};

const JOINED_DATES: Record<string, string> = {
  VaultHunter: "January 8, 2024",
  CryptoKing: "March 4, 2025",
  VoltHunter: "June 18, 2025",
  SweepQueen: "September 13, 2025",
  NeonWolf: "January 22, 2025",
  "0xApe": "April 2, 2025",
  "0xRipper": "November 2, 2024",
  VaultLord: "August 9, 2025",
  DropFiend: "July 30, 2025",
  DropLord: "May 11, 2025",
  MoonRider: "December 1, 2025",
  GrailHunter: "September 13, 2025",
  PackFiend: "October 19, 2025",
};

/** Deterministic vault visibility per username (~55% public). */
function getCollectorTier(username: string): string {
  const tiers = ["Gold Collector", "Platinum Vault", "Silver Hunter", "Elite Ripper"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash + username.charCodeAt(i)) % 997;
  }
  return tiers[hash % tiers.length];
}

function isVaultPublic(username: string): boolean {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash + username.charCodeAt(i) * (i + 1)) % 997;
  }
  return hash % 100 < 55;
}

function topPullsForUser(username: string): Card[] {
  if (COLLECTOR_TOP_PULLS[username]?.length) {
    return COLLECTOR_TOP_PULLS[username];
  }

  return COLLECTOR_TOP_PULLS.VaultHunter ?? [];
}

export function getUserProfile(username: string): UserProfile {
  return {
    username,
    avatar: AVATARS[username] ?? "👤",
    joinedDate: JOINED_DATES[username] ?? "September 13, 2025",
    tier: getCollectorTier(username),
    vaultPublic: isVaultPublic(username),
    topPulls: topPullsForUser(username),
  };
}
