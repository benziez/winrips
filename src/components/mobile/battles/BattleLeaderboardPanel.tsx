import { useMemo } from "react";
import type { TopBattlerRow } from "../../../lib/packBattleLogic";
import { mergeBattleLeaderboard } from "../../../constants/battleLeaderboardBots";
import { resolveBattleRank } from "../../../utils/packBattleRank";
import { BattleRankBadge } from "./BattleRankBadge";

type PodiumMetal = "gold" | "silver" | "bronze";
type PodiumTier = 1 | 2 | 3;

const PODIUM_METAL_CLASS: Record<PodiumMetal, string> = {
  gold: "wins-podium-gold",
  silver: "wins-podium-silver",
  bronze: "wins-podium-bronze",
};

const PODIUM_TIER_CLASS: Record<PodiumTier, string> = {
  1: "wins-podium-tier-1",
  2: "wins-podium-tier-2",
  3: "wins-podium-tier-3",
};

function formatBattlerHandle(username: string): string {
  const trimmed = username.trim();
  if (!trimmed) return "@battler";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function battlerInitial(username: string): string {
  const stripped = username.replace(/^@/, "").trim();
  return (stripped[0] ?? "?").toUpperCase();
}

function battlerAvatarGradient(username: string): string {
  let hash = 0;
  const key = username.replace(/^@/, "").trim().toLowerCase();
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const hue2 = (hue + 42) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 68%, 52%), hsl(${hue2}, 72%, 38%))`;
}

function BattlerAvatar({ username, size = "md" }: { username: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass =
    size === "lg" ? "h-12 w-12 text-[18px]" : size === "md" ? "h-10 w-10 text-[14px]" : "h-9 w-9 text-[13px]";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ${sizeClass}`}
      style={{ background: battlerAvatarGradient(username) }}
      aria-hidden
    >
      {battlerInitial(username)}
    </div>
  );
}

function PodiumSparkles() {
  return (
    <div className="wins-podium-sparkles" aria-hidden>
      <span className="wins-sparkle wins-sparkle--1" />
      <span className="wins-sparkle wins-sparkle--2" />
      <span className="wins-sparkle wins-sparkle--3" />
      <span className="wins-sparkle wins-sparkle--4" />
      <span className="wins-sparkle wins-sparkle--5" />
      <span className="wins-sparkle wins-sparkle--6" />
    </div>
  );
}

function BattlePodiumCard({
  row,
  rank,
  metal,
  tier,
}: {
  row: TopBattlerRow;
  rank: number;
  metal: PodiumMetal;
  tier: PodiumTier;
}) {
  const battleRank = resolveBattleRank(row.wins, row.losses);
  const isFirst = tier === 1;

  return (
    <div className={`relative w-full ${PODIUM_TIER_CLASS[tier]}`}>
      {isFirst ? <PodiumSparkles /> : null}
      <div
        className={`flex h-full w-full flex-col items-center rounded-2xl px-2 py-3 ${PODIUM_METAL_CLASS[metal]}`}
      >
        <span
          className={`leading-none ${isFirst ? "text-[26px]" : tier === 2 ? "text-[20px]" : "text-[18px]"}`}
          aria-hidden
        >
          🏆
        </span>
        <span
          className={`mt-1 font-bold tabular-nums text-white ${
            isFirst ? "text-[22px]" : tier === 2 ? "text-[17px]" : "text-[15px]"
          }`}
        >
          #{rank}
        </span>
        <div className="mt-2">
          <BattlerAvatar username={row.username} size={isFirst ? "lg" : tier === 2 ? "md" : "sm"} />
        </div>
        <p
          className={`mt-2 w-full truncate text-center font-semibold text-white ${
            isFirst ? "text-[13px]" : tier === 2 ? "text-[11px]" : "text-[10px]"
          }`}
        >
          {formatBattlerHandle(row.username)}
        </p>
        <div className="mt-1.5">
          <BattleRankBadge rank={battleRank} size="xs" />
        </div>
        <p
          className={`mt-1.5 font-bold tabular-nums text-[var(--rip-green-bright)] ${
            isFirst ? "text-[15px]" : tier === 2 ? "text-[13px]" : "text-[12px]"
          }`}
        >
          {row.wins}W
        </p>
      </div>
    </div>
  );
}

function BattleLeaderboardRow({
  row,
  rank,
  isLast = false,
}: {
  row: TopBattlerRow;
  rank: number;
  isLast?: boolean;
}) {
  const battleRank = resolveBattleRank(row.wins, row.losses);
  const total = row.wins + row.losses;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${
        isLast ? "" : "border-b border-white/[0.06]"
      }`}
    >
      <span className="w-7 shrink-0 text-[14px] font-bold tabular-nums text-[var(--rip-text-muted)]">
        #{rank}
      </span>
      <BattlerAvatar username={row.username} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-white">
            {formatBattlerHandle(row.username)}
          </span>
          <BattleRankBadge rank={battleRank} size="xs" />
        </div>
        <p className="text-[12px] text-white/45">
          {row.wins}W · {row.losses}L · {total} battles
        </p>
      </div>
      <span className="shrink-0 text-[13px] font-bold tabular-nums text-[var(--rip-green-bright)]">
        {row.winRate}%
      </span>
    </div>
  );
}

export function BattleLeaderboardPanel({
  rows,
  currentUser = null,
}: {
  rows: TopBattlerRow[];
  currentUser?: TopBattlerRow | null;
}) {
  const leaderboard = useMemo(
    () => mergeBattleLeaderboard(rows, currentUser),
    [rows, currentUser],
  );

  const [first, second, third] = leaderboard;
  const rest = leaderboard.slice(3, 10);

  return (
    <div className="mt-4">
      <div className="mb-4 grid grid-cols-3 items-end gap-2">
        <BattlePodiumCard row={second} rank={2} metal="silver" tier={2} />
        <BattlePodiumCard row={first} rank={1} metal="gold" tier={1} />
        <BattlePodiumCard row={third} rank={3} metal="bronze" tier={3} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
        <ul>
          {rest.map((row, index) => (
            <li key={row.userId}>
              <BattleLeaderboardRow
                row={row}
                rank={index + 4}
                isLast={index === rest.length - 1}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
