import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Card } from "../../../types";
import type { StoreRarity } from "../../../types/store";
import { UnboxingCarousel } from "../../pack-opening/UnboxingCarousel";
import { SpinStageAtmosphere } from "../../pack-opening/SpinStageAtmosphere";
import {
  buildFullDropTableStrip,
  ROULETTE_WINNER_INDEX,
} from "../../../utils/rng";
import { glowPaletteForStoreRarity } from "../../../utils/rarityGlowColors";
import { preloadSpinnerStripImages } from "../../../utils/spinnerImagePreload";
import { hapticHeavyImpact, hapticSpinnerTick } from "../../../utils/mobileHaptics";

const MOBILE_SPIN_DURATION_MS = 6_500;
const MOBILE_SPIN_LAND_BUFFER_MS = 250;
const SPINNER_HAPTIC_INTERVAL_MS = 120;
const MOBILE_SPIN_CARD_WIDTH = 160;
/** Full compact card at 160px wide (2.5/3.5 image + name row). */
const BATTLE_SPINNER_LANE_CLASS = "h-[280px]";
const BATTLE_SPINNER_FRAME_CLASS = "h-[280px] min-h-[280px]";
const USER_TO_BOT_PAUSE_MS = 500;
const BOT_TO_RESULT_PAUSE_MS = 1_000;
const SPIN_PRELOAD_LEAD = 20;

type RevealStage = "user-spinning" | "user-landed" | "bot-spinning" | "bot-landed";

interface BattleLaneLabelProps {
  label: string;
  isOpponent?: boolean;
}

function BattleLaneLabel({ label, isOpponent = false }: BattleLaneLabelProps) {
  return (
    <div className="flex w-full shrink-0 justify-center px-3">
      <span className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-black/85 px-3.5 py-1.5 text-sm font-bold tracking-wide text-white">
        {isOpponent ? <span aria-hidden className="shrink-0">⚔️</span> : null}
        <span className="truncate">{label}</span>
      </span>
    </div>
  );
}

interface BattleSpinnerLaneProps {
  label: string;
  strip: Card[];
  isSpinning: boolean;
  reelGlowSettled: boolean;
  spinKey: number;
  rarity: StoreRarity;
  isOpponent?: boolean;
  suppressWinnerGlow?: boolean;
  preloadedImagesBySlot?: Map<number, HTMLImageElement>;
}

function BattleSpinnerLane({
  label,
  strip,
  isSpinning,
  reelGlowSettled,
  spinKey,
  rarity,
  isOpponent = false,
  suppressWinnerGlow = false,
  preloadedImagesBySlot,
}: BattleSpinnerLaneProps) {
  const rarityGlow = glowPaletteForStoreRarity(rarity);
  const showSettledGlow = reelGlowSettled && !suppressWinnerGlow;

  return (
    <div className="flex w-full shrink-0 flex-col items-center gap-3">
      <BattleLaneLabel label={label} isOpponent={isOpponent} />

      <div className={`relative w-full max-w-full shrink-0 ${BATTLE_SPINNER_LANE_CLASS}`}>
        <div
          className="mobile-spinner-wrapper relative h-full w-full max-w-full"
          data-glow-settled={showSettledGlow ? true : undefined}
          style={
            {
              "--spin-needle-color": showSettledGlow ? rarityGlow.needle : "var(--rip-orange)",
            } as CSSProperties
          }
        >
          <SpinStageAtmosphere
            settled={showSettledGlow}
            fastTransition={false}
            rarityGlow={rarityGlow}
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[8%] bg-gradient-to-r from-[var(--rip-bg-primary)] to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-30 w-[8%] bg-gradient-to-l from-[var(--rip-bg-primary)] to-transparent"
            aria-hidden
          />
          <div className="relative z-10 h-full w-full max-w-full">
            <UnboxingCarousel
              key={`battle-spin-${label}-${spinKey}`}
              cards={strip}
              isSpinning={isSpinning}
              winnerIndex={ROULETTE_WINNER_INDEX}
              spinDurationMs={MOBILE_SPIN_DURATION_MS}
              cardWidth={MOBILE_SPIN_CARD_WIDTH}
              compactCards
              suppressEdgeFades
              frameMinHeightClass={BATTLE_SPINNER_FRAME_CLASS}
              preloadedImagesBySlot={preloadedImagesBySlot}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreparingLane({ label, isOpponent = false }: { label: string; isOpponent?: boolean }) {
  return (
    <div className="flex w-full shrink-0 flex-col items-center gap-3">
      <BattleLaneLabel label={label} isOpponent={isOpponent} />
      <div
        className={`flex w-full max-w-full shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] ${BATTLE_SPINNER_LANE_CLASS}`}
      >
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30" />
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/30">
          Loading cards
        </p>
      </div>
    </div>
  );
}

function BotWaitingLane({ label }: { label: string }) {
  return (
    <div className="flex w-full shrink-0 flex-col items-center gap-3">
      <BattleLaneLabel label={label} isOpponent />
      <div
        className={`flex w-full max-w-full shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] ${BATTLE_SPINNER_LANE_CLASS}`}
      >
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30" />
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/30">
          Waiting
        </p>
      </div>
    </div>
  );
}

export function BattleDualSpinnerReveal({
  packId,
  userCard,
  botCard,
  botLabel,
  userRarity,
  botRarity,
  isTieBattle = false,
  onRevealComplete,
}: {
  packId: string;
  userCard: Card;
  botCard: Card;
  botLabel: string;
  userRarity: StoreRarity;
  botRarity: StoreRarity;
  /** When true, spinner lanes skip winner rarity glow after landing. */
  isTieBattle?: boolean;
  onRevealComplete: () => void;
}) {
  const [stage, setStage] = useState<RevealStage>("user-spinning");
  const [userSpinPrepared, setUserSpinPrepared] = useState(false);
  const [userSpinning, setUserSpinning] = useState(false);
  const [userSettled, setUserSettled] = useState(false);
  const [botSpinPrepared, setBotSpinPrepared] = useState(false);
  const [botSpinning, setBotSpinning] = useState(false);
  const [botSettled, setBotSettled] = useState(false);
  const [userSpinKey, setUserSpinKey] = useState(0);
  const [botSpinKey, setBotSpinKey] = useState(0);

  const spinTimerRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const spinnerHapticIntervalRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const userPreloadPinsRef = useRef<HTMLImageElement[]>([]);
  const userPreloadBySlotRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const botPreloadPinsRef = useRef<HTMLImageElement[]>([]);
  const botPreloadBySlotRef = useRef<Map<number, HTMLImageElement>>(new Map());

  const userStrip = useMemo(() => buildFullDropTableStrip(userCard, packId).strip, [packId, userCard]);
  const botStrip = useMemo(() => buildFullDropTableStrip(botCard, packId).strip, [botCard, packId]);

  useEffect(() => {
    let cancelled = false;

    void preloadSpinnerStripImages(botStrip, ROULETTE_WINNER_INDEX, {
      leadCount: SPIN_PRELOAD_LEAD,
      compactMobile: true,
    }).then((preload) => {
      if (cancelled) return;
      botPreloadPinsRef.current = preload.pinned;
      botPreloadBySlotRef.current = preload.byIndex;
    });

    return () => {
      cancelled = true;
    };
  }, [botStrip]);

  const clearTimers = useCallback(() => {
    if (spinTimerRef.current != null) {
      window.clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }
    if (pauseTimerRef.current != null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (spinnerHapticIntervalRef.current != null) {
      window.clearInterval(spinnerHapticIntervalRef.current);
      spinnerHapticIntervalRef.current = null;
    }
  }, []);

  const startHaptics = useCallback(() => {
    if (spinnerHapticIntervalRef.current != null) {
      window.clearInterval(spinnerHapticIntervalRef.current);
    }
    void hapticSpinnerTick();
    spinnerHapticIntervalRef.current = window.setInterval(() => {
      void hapticSpinnerTick();
    }, SPINNER_HAPTIC_INTERVAL_MS);
  }, []);

  const stopHaptics = useCallback(() => {
    if (spinnerHapticIntervalRef.current != null) {
      window.clearInterval(spinnerHapticIntervalRef.current);
      spinnerHapticIntervalRef.current = null;
    }
  }, []);

  const scheduleSpinLand = useCallback(
    (onLand: () => void) => {
      if (spinTimerRef.current != null) {
        window.clearTimeout(spinTimerRef.current);
      }
      spinTimerRef.current = window.setTimeout(() => {
        stopHaptics();
        void hapticHeavyImpact();
        onLand();
      }, MOBILE_SPIN_DURATION_MS + MOBILE_SPIN_LAND_BUFFER_MS);
    },
    [stopHaptics],
  );

  const startUserSpin = useCallback(() => {
    completedRef.current = false;
    setStage("user-spinning");
    setUserSpinKey((key) => key + 1);
    setUserSpinning(true);
    setUserSettled(false);
    setBotSpinning(false);
    setBotSettled(false);
    setBotSpinPrepared(false);
    startHaptics();
    scheduleSpinLand(() => {
      setUserSpinning(false);
      setUserSettled(true);
      setStage("user-landed");
    });
  }, [scheduleSpinLand, startHaptics]);

  const startBotSpin = useCallback(() => {
    setStage("bot-spinning");
    setBotSpinKey((key) => key + 1);
    setBotSpinning(true);
    setBotSettled(false);
    startHaptics();
    scheduleSpinLand(() => {
      setBotSpinning(false);
      setBotSettled(true);
      setStage("bot-landed");
    });
  }, [scheduleSpinLand, startHaptics]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const preload = await preloadSpinnerStripImages(userStrip, ROULETTE_WINNER_INDEX, {
        leadCount: SPIN_PRELOAD_LEAD,
        compactMobile: true,
      });
      if (cancelled) return;
      userPreloadPinsRef.current = preload.pinned;
      userPreloadBySlotRef.current = preload.byIndex;
      setUserSpinPrepared(true);
      startUserSpin();
    })();

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [clearTimers, startUserSpin, userStrip]);

  useEffect(() => {
    if (stage !== "user-landed") return;

    let cancelled = false;

    pauseTimerRef.current = window.setTimeout(() => {
      void (async () => {
        const preload = await preloadSpinnerStripImages(botStrip, ROULETTE_WINNER_INDEX, {
          leadCount: SPIN_PRELOAD_LEAD,
          compactMobile: true,
        });
        if (cancelled) return;
        botPreloadPinsRef.current = preload.pinned;
        botPreloadBySlotRef.current = preload.byIndex;
        setBotSpinPrepared(true);
        startBotSpin();
      })();
    }, USER_TO_BOT_PAUSE_MS);

    return () => {
      cancelled = true;
      if (pauseTimerRef.current != null) {
        window.clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    };
  }, [botStrip, stage, startBotSpin]);

  useEffect(() => {
    if (stage !== "bot-landed" || completedRef.current) return;

    pauseTimerRef.current = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onRevealComplete();
    }, BOT_TO_RESULT_PAUSE_MS);

    return () => {
      if (pauseTimerRef.current != null) {
        window.clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    };
  }, [onRevealComplete, stage]);

  const showBotSpinner = botSpinPrepared && (stage === "bot-spinning" || stage === "bot-landed");

  return (
    <div className="flex w-full max-w-full shrink-0 flex-col items-center gap-6 px-3 py-4">
      {userSpinPrepared ? (
        <BattleSpinnerLane
          label="YOU"
          strip={userStrip}
          isSpinning={userSpinning}
          reelGlowSettled={userSettled}
          spinKey={userSpinKey}
          rarity={userRarity}
          suppressWinnerGlow={isTieBattle}
          preloadedImagesBySlot={userPreloadBySlotRef.current}
        />
      ) : (
        <PreparingLane label="YOU" />
      )}

      {showBotSpinner ? (
        <BattleSpinnerLane
          label={botLabel}
          strip={botStrip}
          isSpinning={botSpinning}
          reelGlowSettled={botSettled}
          spinKey={botSpinKey}
          rarity={botRarity}
          isOpponent
          suppressWinnerGlow={isTieBattle}
          preloadedImagesBySlot={botPreloadBySlotRef.current}
        />
      ) : (
        <BotWaitingLane label={botLabel} />
      )}
    </div>
  );
}
