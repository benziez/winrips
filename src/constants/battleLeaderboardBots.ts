import type { TopBattlerRow } from "../lib/packBattleLogic";
import { battleWinRatePercent } from "../utils/packBattleRank";

/** Simulated top battlers — merged with live `battle_record` data so the board always looks active. */
const BATTLE_LEADERBOARD_BOT_BATTLES = [
  { username: "ripgod_404", wins: 142, losses: 80 },
  { username: "charizard_king", wins: 89, losses: 40 },
  { username: "mythic_ripper", wins: 76, losses: 52 },
  { username: "slab_hunter", wins: 68, losses: 45 },
  { username: "pack_wizard", wins: 61, losses: 38 },
  { username: "holo_chaser", wins: 55, losses: 42 },
  { username: "tcg_legend", wins: 48, losses: 31 },
  { username: "midnight_pull", wins: 41, losses: 29 },
  { username: "volt_ace", wins: 35, losses: 28 },
  { username: "rookie_king", wins: 28, losses: 22 },
] as const;

function botBattlerRow(
  bot: (typeof BATTLE_LEADERBOARD_BOT_BATTLES)[number],
  index: number,
): TopBattlerRow {
  return {
    userId: `leaderboard-bot-${index}`,
    username: bot.username,
    wins: bot.wins,
    losses: bot.losses,
    winRate: battleWinRatePercent(bot.wins, bot.losses),
  };
}

const BOT_BATTLER_ROWS: TopBattlerRow[] = BATTLE_LEADERBOARD_BOT_BATTLES.map(botBattlerRow);

function compareLeaderboardRows(a: TopBattlerRow, b: TopBattlerRow): number {
  if (b.wins !== a.wins) return b.wins - a.wins;
  const aTotal = a.wins + a.losses;
  const bTotal = b.wins + b.losses;
  if (bTotal !== aTotal) return bTotal - aTotal;
  return b.winRate - a.winRate;
}

/** Merge simulated battlers with live rows; real players replace bots when ranked higher. */
export function mergeBattleLeaderboard(
  realRows: TopBattlerRow[],
  currentUser?: TopBattlerRow | null,
): TopBattlerRow[] {
  const byUserId = new Map<string, TopBattlerRow>();

  for (const row of BOT_BATTLER_ROWS) {
    byUserId.set(row.userId, row);
  }
  for (const row of realRows) {
    byUserId.set(row.userId, row);
  }
  if (currentUser?.userId) {
    byUserId.set(currentUser.userId, currentUser);
  }

  return Array.from(byUserId.values()).sort(compareLeaderboardRows).slice(0, 10);
}
