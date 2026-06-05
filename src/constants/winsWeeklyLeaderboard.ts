/** Display label for the fake weekly Wins leaderboard. */
export const WINS_WEEK_LABEL = "Week of May 26 – Jun 1";

/** Inclusive week window for the logged-in user's real weekly total (UTC). */
export const WINS_WEEK_START_ISO = "2026-05-26T00:00:00.000Z";
export const WINS_WEEK_END_ISO = "2026-06-02T00:00:00.000Z";

export interface WinsWeeklyLeaderboardEntry {
  rank: number;
  username: string;
  /** Total gem value pulled this week. */
  weeklyGems: number;
  /** Catalog item id for the user's best pull thumbnail. */
  bestPullCatalogId: string;
}

export const WINS_WEEKLY_LEADERBOARD: WinsWeeklyLeaderboardEntry[] = [
  { rank: 1, username: "charizard_king", weeklyGems: 924_800, bestPullCatalogId: "pk-151-23" },
  { rank: 2, username: "grail_hunter22", weeklyGems: 781_200, bestPullCatalogId: "pk-151-20" },
  { rank: 3, username: "packripper_fl", weeklyGems: 654_500, bestPullCatalogId: "pk-151-16" },
  { rank: 4, username: "pokechaser99", weeklyGems: 589_300, bestPullCatalogId: "pk-151-14" },
  { rank: 5, username: "slabvault_nyc", weeklyGems: 512_700, bestPullCatalogId: "pk-151-19" },
  { rank: 6, username: "moonbreon_guy", weeklyGems: 468_900, bestPullCatalogId: "pk-151-24" },
  { rank: 7, username: "ripgod_404", weeklyGems: 421_600, bestPullCatalogId: "pk-151-13" },
  { rank: 8, username: "tcg_sniper_x", weeklyGems: 387_400, bestPullCatalogId: "pk-151-15" },
  { rank: 9, username: "vmax_dreamer", weeklyGems: 352_100, bestPullCatalogId: "pk-151-10" },
  { rank: 10, username: "psa10_or_bust", weeklyGems: 318_800, bestPullCatalogId: "pk-151-08" },
  { rank: 11, username: "gemstacker77", weeklyGems: 284_500, bestPullCatalogId: "pk-151-07" },
  { rank: 12, username: "first_ed_fl", weeklyGems: 251_200, bestPullCatalogId: "pk-god-20" },
  { rank: 13, username: "alt_art_addict", weeklyGems: 219_700, bestPullCatalogId: "pk-151-05" },
  { rank: 14, username: "pullparty_mia", weeklyGems: 198_400, bestPullCatalogId: "pk-starter-26" },
  { rank: 15, username: "shiny_hunter_", weeklyGems: 176_900, bestPullCatalogId: "pk-starter-27" },
  { rank: 16, username: "wotc_wizard", weeklyGems: 154_300, bestPullCatalogId: "pk-god-15" },
  { rank: 17, username: "box_breaker23", weeklyGems: 132_800, bestPullCatalogId: "pk-151-04" },
  { rank: 18, username: "evolving_rips", weeklyGems: 111_500, bestPullCatalogId: "pk-starter-25" },
  { rank: 19, username: "legendary_luke", weeklyGems: 94_200, bestPullCatalogId: "pk-starter-24" },
  { rank: 20, username: "common_to_god", weeklyGems: 78_600, bestPullCatalogId: "pk-151-02" },
];

export function winsWeeklyRankForGems(weeklyGems: number): number {
  const above = WINS_WEEKLY_LEADERBOARD.filter((entry) => entry.weeklyGems > weeklyGems).length;
  return above + 1;
}
