import type { RewardTier } from "../types";

export const REWARD_TIERS: RewardTier[] = [
  {
    id: "bronze",
    name: "Bronze Ripper",
    requirement: "Open 10 packs",
    bonus: "+500 Gems daily",
    progress: 100,
    unlocked: true,
  },
  {
    id: "silver",
    name: "Silver Vault",
    requirement: "Wager 5,000 Sweeps",
    bonus: "2% rakeback on burns",
    progress: 72,
    unlocked: true,
  },
  {
    id: "gold",
    name: "Gold Syndicate",
    requirement: "Pull 1 Ancient Rare",
    bonus: "Exclusive neon foil packs",
    progress: 40,
    unlocked: false,
  },
  {
    id: "mythic",
    name: "Mythic Overlord",
    requirement: "Top 10 leaderboard",
    bonus: "Private grail drops + affiliate boost",
    progress: 15,
    unlocked: false,
  },
];
