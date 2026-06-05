import { useMemo } from "react";
import { RipBottomSheet } from "../rip/RipBottomSheet";
import { BattleRankBadge } from "./BattleRankBadge";
import {
  formatBattleRankRequirement,
  getBattleRanksInOrder,
  type BattleRank,
  type BattleRankId,
} from "../../../utils/packBattleRank";

interface BattleRanksSheetProps {
  open: boolean;
  onClose: () => void;
  currentRankId: BattleRankId;
}

export function BattleRanksSheet({ open, onClose, currentRankId }: BattleRanksSheetProps) {
  const ranks = useMemo(() => getBattleRanksInOrder(), []);

  return (
    <RipBottomSheet
      open={open}
      onClose={onClose}
      showClose={false}
      dragToDismiss
      heightClass="max-h-[80vh]"
    >
      <div className="max-h-[80vh] overflow-y-auto overscroll-contain pt-3">
        <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-white/20" aria-hidden />

        <h2 className="shrink-0 px-6 pt-4 text-center text-[17px] font-bold text-white">
          Battle Ranks
        </h2>

        <ul className="mt-4 px-4 pb-[calc(4rem+env(safe-area-inset-bottom))]">
          {ranks.map((rank, index) => (
            <BattleRankRow
              key={rank.id}
              rank={rank}
              nextRank={ranks[index + 1] ?? null}
              isCurrent={rank.id === currentRankId}
            />
          ))}
        </ul>
      </div>
    </RipBottomSheet>
  );
}

function BattleRankRow({
  rank,
  nextRank,
  isCurrent,
}: {
  rank: BattleRank;
  nextRank: BattleRank | null;
  isCurrent: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 ${
        isCurrent ? "bg-white/[0.07]" : ""
      }`}
    >
      <BattleRankBadge rank={rank} size="sm" />
      <p className="shrink-0 text-right text-[12px] text-white/45">
        {formatBattleRankRequirement(rank, nextRank)}
      </p>
    </li>
  );
}
