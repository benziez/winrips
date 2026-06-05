export type BattleRankId =
  | "rookie"
  | "ripper"
  | "grail-hunter"
  | "pack-warrior"
  | "rip-god"
  | "mythic-puller"
  | "champion";

export interface BattleRank {
  id: BattleRankId;
  label: string;
  badgeClass: string;
  accentColor: string;
  minBattles: number;
  minWinRate: number;
}

const BATTLE_RANK_ORDER: BattleRankId[] = [
  "rookie",
  "ripper",
  "grail-hunter",
  "pack-warrior",
  "rip-god",
  "mythic-puller",
  "champion",
];

const BATTLE_RANK_TIERS: BattleRank[] = [
  {
    id: "champion",
    label: "Champion",
    badgeClass:
      "battle-rank-champion bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black shadow-[0_0_18px_rgba(242,214,128,0.45)]",
    accentColor: "#F2D680",
    minBattles: 500,
    minWinRate: 0.55,
  },
  {
    id: "mythic-puller",
    label: "Mythic Puller",
    badgeClass: "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white",
    accentColor: "#ec4899",
    minBattles: 200,
    minWinRate: 0.52,
  },
  {
    id: "rip-god",
    label: "Rip God",
    badgeClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-black",
    accentColor: "#f59e0b",
    minBattles: 100,
    minWinRate: 0.5,
  },
  {
    id: "pack-warrior",
    label: "Pack Warrior",
    badgeClass: "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
    accentColor: "#a855f7",
    minBattles: 50,
    minWinRate: 0.48,
  },
  {
    id: "grail-hunter",
    label: "Grail Hunter",
    badgeClass: "bg-gradient-to-r from-emerald-500 to-green-600 text-white",
    accentColor: "#22c55e",
    minBattles: 25,
    minWinRate: 0.45,
  },
  {
    id: "ripper",
    label: "Ripper",
    badgeClass: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    accentColor: "#3b82f6",
    minBattles: 10,
    minWinRate: 0,
  },
  {
    id: "rookie",
    label: "Rookie",
    badgeClass: "bg-gradient-to-r from-zinc-500/90 to-zinc-600/90 text-white",
    accentColor: "#a1a1aa",
    minBattles: 0,
    minWinRate: 0,
  },
];

export function battleWinRatePercent(wins: number, losses: number): number {
  const total = wins + losses;
  if (total <= 0) return 0;
  return Math.round((wins / total) * 100);
}

export function resolveBattleRank(wins: number, losses: number): BattleRank {
  const total = wins + losses;
  const winRate = total > 0 ? wins / total : 0;

  for (const tier of BATTLE_RANK_TIERS) {
    if (total >= tier.minBattles && winRate >= tier.minWinRate) {
      return tier;
    }
  }

  return BATTLE_RANK_TIERS[BATTLE_RANK_TIERS.length - 1]!;
}

export function battleRankIndex(id: BattleRankId): number {
  return BATTLE_RANK_ORDER.indexOf(id);
}

export function isBattleRankUpgrade(fromId: BattleRankId, toId: BattleRankId): boolean {
  return battleRankIndex(toId) > battleRankIndex(fromId);
}

export function detectBattleRankUp(
  prevWins: number,
  prevLosses: number,
  nextWins: number,
  nextLosses: number,
): BattleRank | null {
  const prev = resolveBattleRank(prevWins, prevLosses);
  const next = resolveBattleRank(nextWins, nextLosses);
  if (isBattleRankUpgrade(prev.id, next.id)) return next;
  return null;
}

export function formatBattleRecord(wins: number, losses: number): string {
  const winRate = battleWinRatePercent(wins, losses);
  return `${wins}W — ${losses}L | ${winRate}% Win Rate`;
}

export function getBattleRanksInOrder(): BattleRank[] {
  return BATTLE_RANK_ORDER.map(
    (id) => BATTLE_RANK_TIERS.find((tier) => tier.id === id)!,
  );
}

export function formatBattleRankRequirement(
  rank: BattleRank,
  nextRank: BattleRank | null,
): string {
  const winRateSuffix =
    rank.minWinRate > 0 ? ` · ${Math.round(rank.minWinRate * 100)}% win rate` : "";

  if (!nextRank) {
    return `${rank.minBattles}+ battles${winRateSuffix}`;
  }

  const maxBattles = nextRank.minBattles - 1;
  if (rank.minBattles === 0) {
    return `0–${maxBattles} battles`;
  }

  return `${rank.minBattles}–${maxBattles} battles${winRateSuffix}`;
}
