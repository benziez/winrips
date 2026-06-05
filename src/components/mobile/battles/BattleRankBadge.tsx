import type { BattleRank } from "../../../utils/packBattleRank";

const SIZE_CLASS = {
  xs: "px-1.5 py-0.5 text-[9px] tracking-wide",
  sm: "px-2 py-0.5 text-[10px] tracking-wider",
  md: "px-3 py-1 text-[11px] tracking-wider",
} as const;

export function BattleRankBadge({
  rank,
  size = "sm",
  showTrophy = false,
}: {
  rank: BattleRank;
  size?: keyof typeof SIZE_CLASS;
  showTrophy?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-bold uppercase ${SIZE_CLASS[size]} ${rank.badgeClass}`}
    >
      {showTrophy ? <span aria-hidden>🏆</span> : null}
      {rank.label}
    </span>
  );
}
