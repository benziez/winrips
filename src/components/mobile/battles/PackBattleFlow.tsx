import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share2 } from "lucide-react";
import type { Pack } from "../../../types";
import type { Card } from "../../../types";
import type { StoreRarity } from "../../../types/store";
import { useApp } from "../../../context/AppContext";
import { openPack } from "../../../lib/spinLogic";
import {
  awardBattleBonus,
  battleWinBonusCents,
  recordBattleLoss,
  resolveBattleOutcome,
  type BattleOutcome,
  type BattleRecord,
} from "../../../lib/packBattleLogic";
import { pickRandomBattleBot } from "../../../constants/packBattleUsernames";
import { rollCardForPackWithRoll, resolveWinnerItem } from "../../../utils/rng";
import { getPackDropTable } from "../../../data/packDropTables";
import type { PackDropEntry } from "../../../data/packDropTables";
import { formatUsd, gemsToUsd } from "../../../constants/retail";
import { normalizePackId } from "../../../constants/packIdAliases";
import { generateBattleShareImage, shareBattleResultImage } from "../../../utils/packBattleShareImage";
import StarField from "../StarField";
import { BattleDualSpinnerReveal } from "./BattleDualSpinnerReveal";
import { BattleRevealDuel } from "./BattleCardReveal";
import { BattleRankBadge } from "./BattleRankBadge";
import { BattleRankUpCelebration } from "./BattleRankUpCelebration";
import { hapticHeavyImpact, hapticTabSelect } from "../../../utils/mobileHaptics";
import { detectBattleRankUp, resolveBattleRank } from "../../../utils/packBattleRank";
import type { BattleRank } from "../../../utils/packBattleRank";
import { OVERLAY_DISMISS_EXIT, OVERLAY_DISMISS_TRANSITION } from "../rip/ripMotion";
import { DismissPill } from "../DismissPill";

type BattlePhase =
  | "matchmaking"
  | "opponent-found"
  | "countdown"
  | "reveal"
  | "rank-up"
  | "result"
  | "error";

interface BotProfile {
  username: string;
  avatarColor: string;
  initial: string;
}

interface BotBattleSnapshot {
  wins: number;
  losses: number;
  winRate: number;
  totalBattles: number;
}

interface PackBattleFlowProps {
  pack: Pack;
  userHandle: string;
  record: BattleRecord;
  onRecordChange: (record: BattleRecord) => void;
  onClose: () => void;
  onBattleAgain: () => void;
}

function resolveStoreRarity(packId: string, card: Card): StoreRarity {
  const table = getPackDropTable(packId);
  return table.find((entry: PackDropEntry) => entry.card.id === card.id)?.storeRarity ?? "Common";
}

function cardFromOpenPackWinner(
  packId: string,
  winner: { itemId: string; itemName: string; gemValue: number; imageUrl: string },
): Card {
  return resolveWinnerItem(packId, {
    id: winner.itemId,
    name: winner.itemName,
    rarity: "Common",
    value: winner.gemValue,
    image: winner.imageUrl,
  });
}

function buildBotBattleSnapshot(): BotBattleSnapshot {
  const totalBattles = 10 + Math.floor(Math.random() * 41);
  const winRate = 60 + Math.floor(Math.random() * 16);
  const wins = Math.round((totalBattles * winRate) / 100);
  const losses = Math.max(0, totalBattles - wins);
  return { wins, losses, winRate, totalBattles };
}

export function PackBattleFlow({
  pack,
  userHandle,
  record,
  onRecordChange,
  onClose,
  onBattleAgain,
}: PackBattleFlowProps) {
  const {
    userId,
    goldVolts,
    setGoldVolts,
    syncGemBalanceFromServer,
    showCashoutToast,
    showErrorToast,
  } = useApp();

  const [phase, setPhase] = useState<BattlePhase>("matchmaking");
  const [bot, setBot] = useState<BotProfile>(() => pickRandomBattleBot());
  const [botStats, setBotStats] = useState<BotBattleSnapshot>(() => buildBotBattleSnapshot());
  const [opponentDecisionSeconds, setOpponentDecisionSeconds] = useState(15);
  const [countdown, setCountdown] = useState(3);
  const [userCard, setUserCard] = useState<Card | null>(null);
  const [botCard, setBotCard] = useState<Card | null>(null);
  const [battleOutcome, setBattleOutcome] = useState<BattleOutcome | null>(null);
  const [bonusUsd, setBonusUsd] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const [localRecord, setLocalRecord] = useState(record);
  const [unlockedRank, setUnlockedRank] = useState<BattleRank | null>(null);
  const resolvedRef = useRef(false);

  const packPriceUsd = useMemo(() => gemsToUsd(pack.cost), [pack.cost]);
  const userRank = useMemo(
    () => resolveBattleRank(localRecord.wins, localRecord.losses),
    [localRecord.losses, localRecord.wins],
  );
  const botRank = useMemo(
    () => resolveBattleRank(botStats.wins, botStats.losses),
    [botStats.losses, botStats.wins],
  );

  const userRarity = userCard ? resolveStoreRarity(pack.id, userCard) : "Common";
  const botRarity = botCard ? resolveStoreRarity(pack.id, botCard) : "Common";

  const previewOutcome = useMemo(() => {
    if (!userCard || !botCard) return null;
    return resolveBattleOutcome(userCard.value, botCard.value);
  }, [botCard, userCard]);

  useEffect(() => {
    setLocalRecord(record);
  }, [record]);

  useEffect(() => {
    let cancelled = false;
    resolvedRef.current = false;

    const botProfile = pickRandomBattleBot();
    setBot(botProfile);
    setBotStats(buildBotBattleSnapshot());
    setPhase("matchmaking");
    setOpponentDecisionSeconds(15);
    setCountdown(3);
    setUserCard(null);
    setBotCard(null);
    setBattleOutcome(null);
    setBonusUsd(0);
    setUnlockedRank(null);
    setErrorMessage("");

    const matchmakingMs = 2000 + Math.floor(Math.random() * 1000);

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setPhase("opponent-found");
    }, matchmakingMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pack.id]);

  useEffect(() => {
    if (phase !== "opponent-found") return;
    if (opponentDecisionSeconds <= 0) {
      onClose();
      return;
    }
    const timer = window.setTimeout(() => setOpponentDecisionSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [onClose, opponentDecisionSeconds, phase]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      return;
    }
    void hapticTabSelect();
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, phase]);

  useEffect(() => {
    if (phase !== "countdown" || countdown > 0 || !userCard) return;
    void hapticHeavyImpact();

    const botRoll = rollCardForPackWithRoll(pack.id, { riskyRip: false });
    setBotCard(resolveWinnerItem(pack.id, botRoll.card));
    setPhase("reveal");
  }, [countdown, pack.id, phase, userCard]);

  const resolveOutcome = useCallback(async () => {
    if (resolvedRef.current || !userCard || !botCard || !userId) return;
    resolvedRef.current = true;

    const outcome = resolveBattleOutcome(userCard.value, botCard.value);
    setBattleOutcome(outcome);

    if (outcome === "tie") {
      setPhase("result");
      return;
    }

    const nextRecord =
      outcome === "win"
        ? { wins: localRecord.wins + 1, losses: localRecord.losses }
        : { wins: localRecord.wins, losses: localRecord.losses + 1 };

    const rankUp = detectBattleRankUp(
      localRecord.wins,
      localRecord.losses,
      nextRecord.wins,
      nextRecord.losses,
    );
    if (rankUp) {
      setUnlockedRank(rankUp);
      setPhase("rank-up");
    } else {
      setPhase("result");
    }

    setLocalRecord(nextRecord);
    onRecordChange(nextRecord);

    if (outcome === "win") {
      const bonusCents = battleWinBonusCents(pack.cost);
      setBonusUsd(gemsToUsd(bonusCents));
      const bonusResult = await awardBattleBonus(userId, pack.cost);
      if (bonusResult.ok) {
        if (Number.isFinite(bonusResult.gemsBalance)) {
          setGoldVolts(bonusResult.gemsBalance!);
        } else {
          await syncGemBalanceFromServer(userId);
        }
      } else {
        showErrorToast(bonusResult.error);
      }
    } else {
      const lossResult = await recordBattleLoss(userId);
      if (!lossResult.ok) {
        showErrorToast(lossResult.error);
      }
    }
  }, [
    botCard,
    localRecord.losses,
    localRecord.wins,
    onRecordChange,
    pack.cost,
    setGoldVolts,
    showErrorToast,
    syncGemBalanceFromServer,
    userCard,
    userId,
  ]);

  const handleRevealComplete = useCallback(() => {
    void resolveOutcome();
  }, [resolveOutcome]);

  const handleRankUpComplete = useCallback(() => {
    setPhase("result");
  }, []);

  async function handleAcceptOpponent() {
    if (!userId) {
      setErrorMessage("Sign in to start battles.");
      setPhase("error");
      return;
    }

    void hapticTabSelect();
    setCountdown(3);
    setPhase("countdown");

    const openResult = await openPack(
      normalizePackId(pack.id),
      pack.cost,
      1,
      userId,
      false,
    );
    if (!openResult.ok) {
      setErrorMessage(openResult.error);
      setPhase("error");
      return;
    }

    const winner = openResult.winners[0];
    if (!winner) {
      setErrorMessage("No card returned from pack open.");
      setPhase("error");
      return;
    }

    const playerCard = cardFromOpenPackWinner(pack.id, winner);
    setUserCard(playerCard);
    setGoldVolts(openResult.gemsBalance);
  }

  function handleDeclineOpponent() {
    void hapticTabSelect();
    onClose();
  }

  async function handleShare() {
    if (!userCard || !botCard || !battleOutcome || sharing) return;
    setSharing(true);
    try {
      const blob = await generateBattleShareImage({
        userCard,
        botCard,
        outcome: battleOutcome,
        wins: localRecord.wins,
        losses: localRecord.losses,
        packName: pack.name,
        botUsername: bot.username,
      });
      if (!blob) {
        showErrorToast("Could not generate share image.");
        return;
      }
      const shareTitle =
        battleOutcome === "win"
          ? "WinRips Battle Win!"
          : battleOutcome === "loss"
            ? "WinRips Battle"
            : "WinRips Battle Tie";
      const shared = await shareBattleResultImage(blob, shareTitle);
      if (shared) showCashoutToast("Battle card saved.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#0a0015]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={OVERLAY_DISMISS_EXIT}
      transition={OVERLAY_DISMISS_TRANSITION}
    >
      <StarField packPrice={packPriceUsd} className="absolute inset-0" />

      <div
        className="relative z-10 flex shrink-0 items-center justify-end gap-2 px-4 pb-2"
        style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.25rem)" }}
      >
        {phase === "result" ? (
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={sharing}
            aria-label="Share battle result"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white disabled:opacity-40"
          >
            <Share2 size={18} />
          </button>
        ) : null}
        {phase === "error" ? <DismissPill onClick={onClose} /> : null}
      </div>

      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col ${
          phase === "reveal" ? "px-0 pb-0" : "items-center justify-center px-4 pb-8"
        }`}
      >
        <AnimatePresence mode="wait">
          {phase === "matchmaking" ? (
            <motion.div
              key="matchmaking"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                className="h-16 w-16 rounded-full border-2 border-white/20 border-t-[var(--rip-green-bright)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="mt-8 text-[22px] font-bold text-white">Finding opponent...</p>
              <p className="mt-2 text-[14px] text-white/50">{pack.name}</p>
            </motion.div>
          ) : null}

          {phase === "opponent-found" || phase === "countdown" ? (
            <motion.div
              key={phase}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full max-w-md flex-col items-center"
            >
              <div className="flex w-full items-center justify-between gap-4">
                <div className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--rip-green)]/20 text-[22px] font-bold text-white ring-2 ring-[var(--rip-green)]/40">
                    {(userHandle[0] ?? "Y").toUpperCase()}
                  </div>
                  <p className="max-w-[120px] truncate text-[14px] font-semibold text-white">
                    You
                  </p>
                  <BattleRankBadge rank={userRank} size="xs" />
                </div>

                <motion.span
                  className="text-[36px] font-black italic text-white/80"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  VS
                </motion.span>

                <div className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-[22px] font-bold text-white ring-2 ring-white/20"
                    style={{ backgroundColor: bot.avatarColor }}
                  >
                    {bot.initial}
                  </div>
                  <p className="max-w-[120px] truncate text-[14px] font-semibold text-white">
                    {bot.username}
                  </p>
                  <BattleRankBadge rank={botRank} size="xs" />
                </div>
              </div>

              {phase === "countdown" ? (
                <motion.p
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-12 text-[88px] font-black tabular-nums text-white"
                >
                  {countdown > 0 ? countdown : "…"}
                </motion.p>
              ) : (
                <>
                  <p className="mt-8 text-[24px] font-bold text-white">Opponent Found</p>
                  <p className="mt-2 text-[14px] font-semibold tabular-nums text-[var(--rip-green-bright)]">
                    {botStats.wins}W — {botStats.losses}L · {botStats.winRate}% Win Rate
                  </p>
                  <p className="mt-1 text-[12px] text-white/55">
                    {botStats.totalBattles} total battles
                  </p>
                  <p className="mt-2 text-[12px] tabular-nums text-amber-300/90">
                    Auto-decline in {opponentDecisionSeconds}s
                  </p>
                  <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => void handleAcceptOpponent()}
                      className="flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[var(--rip-green)] to-fuchsia-500 text-[15px] font-semibold text-black"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={handleDeclineOpponent}
                      className="flex h-12 items-center justify-center rounded-full bg-white/10 text-[15px] font-semibold text-white"
                    >
                      Decline
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ) : null}

          {phase === "reveal" && userCard && botCard ? (
            <motion.div
              key="battle-reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full shrink-0 flex-col justify-center overflow-y-auto"
            >
              <BattleDualSpinnerReveal
                packId={pack.id}
                userCard={userCard}
                botCard={botCard}
                botLabel={bot.username}
                userRarity={userRarity}
                botRarity={botRarity}
                isTieBattle={previewOutcome === "tie"}
                onRevealComplete={handleRevealComplete}
              />
            </motion.div>
          ) : null}

          {phase === "result" && userCard && botCard && battleOutcome ? (
            <motion.div
              key="battle-result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex w-full max-w-xl flex-col items-center px-4"
            >
              <p
                className={`text-[50px] font-black leading-none tracking-tight ${
                  battleOutcome === "win"
                    ? "text-[#F2D680]"
                    : battleOutcome === "loss"
                      ? "text-red-400"
                      : "text-white/65"
                }`}
              >
                {battleOutcome === "win"
                  ? "You Won"
                  : battleOutcome === "loss"
                    ? "You Lost"
                    : "Tie"}
              </p>

              <div className="mt-10 w-full">
                <BattleRevealDuel
                  userCard={userCard}
                  botCard={botCard}
                  userRarity={userRarity}
                  botRarity={botRarity}
                  botLabel={bot.username}
                  outcome={battleOutcome}
                />
              </div>

              {battleOutcome === "tie" ? (
                <p className="mt-6 text-center text-[15px] leading-relaxed text-white/50">
                  Same pull value — no bonus and your record stays the same.
                </p>
              ) : null}

              {battleOutcome === "win" ? (
                <p className="mt-8 text-[17px] font-semibold text-[var(--rip-green-bright)]">
                  +{formatUsd(bonusUsd)} added to your balance
                </p>
              ) : null}

              <div className="mt-12 flex w-full max-w-sm flex-col gap-4">
                <button
                  type="button"
                  onClick={() => {
                    void hapticTabSelect();
                    onBattleAgain();
                  }}
                  className="flex h-12 items-center justify-center rounded-full bg-fuchsia-500 text-[15px] font-semibold text-white"
                >
                  Battle Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void hapticTabSelect();
                    onClose();
                  }}
                  className="flex h-12 items-center justify-center rounded-full bg-white/10 text-[15px] font-semibold text-white"
                >
                  Back to Lobby
                </button>
              </div>
            </motion.div>
          ) : null}

          {phase === "error" ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex max-w-sm flex-col items-center text-center"
            >
              <p className="text-[22px] font-bold text-white">Battle unavailable</p>
              <p className="mt-3 text-[14px] leading-relaxed text-white/60">{errorMessage}</p>
              {goldVolts < pack.cost ? (
                <p className="mt-2 text-[13px] text-amber-300/90">
                  Need {formatUsd(gemsToUsd(pack.cost))} to battle this pack.
                </p>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="mt-8 flex h-12 w-full max-w-xs items-center justify-center rounded-full bg-white/10 text-[15px] font-semibold text-white"
              >
                Back to Lobby
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {phase === "rank-up" && unlockedRank ? (
          <BattleRankUpCelebration
            key="rank-up"
            rank={unlockedRank}
            onComplete={handleRankUpComplete}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
