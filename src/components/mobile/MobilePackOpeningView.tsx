import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { recordPlayHistory } from "../../lib/playHistory";
import { openPack } from "../../lib/spinLogic";
import {
  buildFullDropTableStrip,
  cardFromPullEntry,
  rollMultipleWithRoll,
  ROULETTE_WINNER_INDEX,
  type PackPullEntry,
} from "../../utils/rng";
import { formatPackPriceUsd, formatUsd, gemsToUsd, canShipCardValue } from "../../constants/retail";
import { formatPackExpectedValueUsd } from "../../utils/packValueRange";
import { AddFundsModal, defaultDepositUsdForShortfall } from "./rip/AddFundsModal";
import { AdjustOddsSheet } from "./rip/AdjustOddsSheet";
import { RipCardTile } from "./rip/RipCardTile";
import { PackCatalogImage } from "./PackCatalogImage";
import { UnboxingCarousel } from "../pack-opening/UnboxingCarousel";
import { SpinStageAtmosphere } from "../pack-opening/SpinStageAtmosphere";
import { glowPaletteForStoreRarity, type RarityGlowPalette } from "../../utils/rarityGlowColors";
import { MobileWhatsInsideDrawer } from "./MobileWhatsInsideDrawer";
import { hapticHeavyImpact, hapticSpinnerTick, hapticTabSelect } from "../../utils/mobileHaptics";
import { isFastModeEnabled } from "../../lib/mobileRipPreferences";
import {
  buildPendingFairnessSession,
  commitFairnessSession,
  type FairnessSession,
} from "../../utils/provablyFair";
import { TransactionFailureModal } from "../pack-opening/TransactionFailureModal";
import { formatProbability, getPackDropTable } from "../../data/packDropTables";
import type { StoreRarity } from "../../types/store";
import type { Card, VaultedCard } from "../../types";
import { CollectibleImage } from "../ui/CollectibleImage";
import { ChevronLeft, ChevronRight, InfoIcon } from "../icons/AppIcons";
import { PAGE_STACK_SPRING } from "./mobileTheme";
import { MobileErrorBoundary } from "./MobileErrorBoundary";
import { DismissPill } from "./DismissPill";
import { GlassSurface } from "./GlassSurface";
import { RipBottomSheet } from "./rip/RipBottomSheet";
import { ShipCardSheet } from "./vault/ShipCardSheet";

type OpenPhase = "pre-rip" | "spinning" | "complete";

const BUTTON_SPRING = { type: "spring" as const, stiffness: 500, damping: 26 };
const INSIDE_GRID_PREVIEW = 6;
const SPINNER_EXIT_TRANSITION = { duration: 0.25 };
const COMPLETE_ENTER_TRANSITION = { duration: 0.4, ease: "easeOut" as const, delay: 0.15 };
const COMPLETE_EXIT_TRANSITION = { duration: 0.4, ease: "easeOut" as const };
const MOBILE_SPIN_DURATION_MS = 6_500;
const FAST_SPIN_DURATION_MS = 1_000;
const MOBILE_SPIN_LAND_BUFFER_MS = 250;
const SPINNER_HAPTIC_INTERVAL_MS = 120;
const MOBILE_SPIN_CARD_WIDTH = 200;

const COMPLETE_ACTION_BTN =
  "flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-semibold transition-opacity active:opacity-80 disabled:opacity-30";

function resolveStoreRarityForCard(
  card: Card | null | undefined,
  dropTable: ReturnType<typeof getPackDropTable>,
): StoreRarity {
  if (!card) return "Common";
  return dropTable.find((entry) => entry.card.id === card.id)?.storeRarity ?? "Common";
}

function resolveStoreRarityForEntry(
  entry: PackPullEntry | null | undefined,
  card: Card | null | undefined,
  dropTable: ReturnType<typeof getPackDropTable>,
): StoreRarity {
  const fromServer = entry?.serverStoreRarity?.trim();
  if (
    fromServer === "Common" ||
    fromServer === "Rare" ||
    fromServer === "Epic" ||
    fromServer === "Legendary" ||
    fromServer === "Mythic"
  ) {
    return fromServer;
  }
  return resolveStoreRarityForCard(card, dropTable);
}

const WINNER_PRELOAD_RADIUS = 2;

/** Warm the browser cache for the landing card + immediate neighbors before the reel stops. */
function preloadWinnerArt(strip: Card[], winnerIndex: number): void {
  if (typeof window === "undefined") return;
  for (let offset = -WINNER_PRELOAD_RADIUS; offset <= WINNER_PRELOAD_RADIUS; offset += 1) {
    const url = strip[winnerIndex + offset]?.image?.trim();
    if (!url) continue;
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}

/** Celebration intensity per rarity tier — common stays modest, grail goes huge. */
const STORE_RARITY_RANK: Record<StoreRarity, number> = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  Mythic: 4,
};

interface RevealTier {
  rank: number;
  auraOpacity: number;
  auraScale: number;
  showRays: boolean;
  showSparkles: boolean;
  fromScale: number;
  stiffness: number;
  damping: number;
}

function revealTierForRarity(rarity: StoreRarity): RevealTier {
  const rank = STORE_RARITY_RANK[rarity] ?? 0;
  const high = rank >= 3;
  return {
    rank,
    auraOpacity: 0.22 + rank * 0.12,
    auraScale: 1 + rank * 0.06,
    showRays: high,
    showSparkles: high,
    fromScale: rank >= 3 ? 0.35 : rank >= 1 ? 0.5 : 0.62,
    stiffness: rank >= 3 ? 420 : 320,
    damping: rank >= 3 ? 17 : 22,
  };
}

/** Brief white flash on the card's arrival. */
function FlashBurst() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-[3] h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9), transparent 60%)" }}
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: [0, 0.85, 0], scale: [0.2, 1.4, 1.9] }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
}

function RevealAura({ palette, tier }: { palette: RarityGlowPalette; tier: RevealTier }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        background: `radial-gradient(circle at 50% 45%, rgba(${palette.rgb}, ${tier.auraOpacity}), transparent 70%)`,
        filter: "blur(6px)",
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: tier.auraScale }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
}

function LightRays({ palette }: { palette: RarityGlowPalette }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2"
      style={{
        background: `repeating-conic-gradient(from 0deg at 50% 50%, rgba(${palette.rgb}, 0.16) 0deg, transparent 7deg 22deg)`,
        maskImage: "radial-gradient(circle, black 0%, transparent 62%)",
        WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 62%)",
      }}
      initial={{ opacity: 0, rotate: 0 }}
      animate={{ opacity: 1, rotate: 360 }}
      transition={{
        opacity: { duration: 0.6, ease: "easeOut" },
        rotate: { duration: 26, repeat: Infinity, ease: "linear" },
      }}
    />
  );
}

function Sparkles({ palette }: { palette: RarityGlowPalette }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        size: 3 + Math.random() * 4,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            backgroundColor: palette.needle,
            boxShadow: `0 0 8px ${palette.needle}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 1.4, delay: d.delay, repeat: Infinity, repeatDelay: 0.7 }}
        />
      ))}
    </div>
  );
}

function RarityBadge({ rarity, palette }: { rarity: StoreRarity; palette: RarityGlowPalette }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]"
      style={{
        color: palette.needle,
        backgroundColor: `rgba(${palette.rgb}, 0.14)`,
        boxShadow: `0 0 18px rgba(${palette.rgb}, 0.35)`,
      }}
    >
      {rarity}
    </span>
  );
}

/** Animated $0 -> final value count-up. Always plays in full (independent of Fast Mode). */
function CountUpValue({
  valueGems,
  durationMs = 800,
  className,
}: {
  valueGems: number;
  durationMs?: number;
  className?: string;
}) {
  const [displayGems, setDisplayGems] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayGems(valueGems * eased);
      if (t < 1) raf = requestAnimationFrame(step);
      else setDisplayGems(valueGems);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [valueGems, durationMs]);

  return <span className={className}>{formatUsd(gemsToUsd(displayGems))}</span>;
}

/** Rarity-escalated reveal: aura + (rays/sparkles for high tiers) + flash + spring-in card. */
function RevealStage({ card, rarity }: { card: Card; rarity: StoreRarity }) {
  const palette = glowPaletteForStoreRarity(rarity);
  const tier = revealTierForRarity(rarity);
  return (
    <div className="relative flex w-[min(72vw,340px)] items-center justify-center">
      <RevealAura palette={palette} tier={tier} />
      {tier.showRays ? <LightRays palette={palette} /> : null}
      {tier.showSparkles ? <Sparkles palette={palette} /> : null}
      <FlashBurst />
      <motion.div
        className="relative z-[2] w-[min(58vw,300px)]"
        initial={{ scale: tier.fromScale, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: tier.stiffness, damping: tier.damping }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        >
          <div
            className="pointer-events-none absolute -bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <CollectibleImage
            src={card.image}
            alt={card.name}
            className="w-full object-contain"
            priority
            optimize={false}
            forceShow
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

function cardFromServerWinner(packId: string, winner: {
  itemId: string;
  itemName: string;
  gemValue: number;
  imageUrl: string;
}): Card {
  return cardFromPullEntry(packId, {
    itemId: winner.itemId,
    rolledNumber: 0,
    serverItemName: winner.itemName,
    serverImageUrl: winner.imageUrl,
    serverGemValue: winner.gemValue,
  });
}

interface RipSuccess {
  ok: true;
  entries: PackPullEntry[];
  vaultIds: string[];
}

interface RipFailure {
  ok: false;
  cancelled?: boolean;
}

type RipResult = RipSuccess | RipFailure;

export function MobilePackOpeningView() {
  const navigate = useNavigate();
  const {
    selectedPack,
    goToLobby,
    setGoldVolts,
    showCashoutToast,
    showErrorToast,
    goldVolts,
    userId,
    appendVaultPullFromSpin,
    setSpinInProgress,
    syncGemBalanceFromServer,
    setAddFundsModalOpen,
  } = useApp();
  const isGuest = !userId;

  const [phase, setPhase] = useState<OpenPhase>("pre-rip");
  const [isChargingSpin, setIsChargingSpin] = useState(false);
  const [pullQueue, setPullQueue] = useState<PackPullEntry[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [pullVaultIds, setPullVaultIds] = useState<string[]>([]);
  const [fairnessSession, setFairnessSession] = useState<FairnessSession | null>(null);
  const [transactionFailureOpen, setTransactionFailureOpen] = useState(false);
  const [whatsInsideOpen, setWhatsInsideOpen] = useState(false);
  const [adjustOddsOpen, setAdjustOddsOpen] = useState(false);
  const [revealStoreRarity, setRevealStoreRarity] = useState<StoreRarity>("Common");
  const [carouselCards, setCarouselCards] = useState<Card[]>([]);
  const [isCarouselSpinning, setIsCarouselSpinning] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [completeInfoOpen, setCompleteInfoOpen] = useState(false);
  const [shipSheetOpen, setShipSheetOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [reelGlowSettled, setReelGlowSettled] = useState(false);
  const [reelGlowFast, setReelGlowFast] = useState(false);
  const pendingSpinAfterDeposit = useRef(false);

  const spinLandTimerRef = useRef<number | null>(null);
  const spinnerHapticIntervalRef = useRef<number | null>(null);

  const [quantity, setQuantity] = useState(1);
  // Fast Mode is set in Account; read the persisted pref on mount so each open honors it.
  const [fastMode] = useState(() => isFastModeEnabled());
  const fastModeRef = useRef(fastMode);
  useEffect(() => {
    fastModeRef.current = fastMode;
  }, [fastMode]);

  const activeVaultItemId = pullVaultIds[queueIndex] ?? null;
  const activePullCard = useMemo(() => {
    if (!selectedPack) return null;
    const entry = pullQueue[queueIndex];
    if (!entry) return null;
    return cardFromPullEntry(selectedPack.id, entry);
  }, [selectedPack, pullQueue, queueIndex]);

  // Pullable cards for the inline "What's Inside" grid — deduped, highest value first.
  const insideCards = useMemo(() => {
    if (!selectedPack) return [] as Card[];
    const sorted = [...getPackDropTable(selectedPack.id)].sort(
      (a, b) => b.card.value - a.card.value,
    );
    const uniq = new Map<string, Card>();
    for (const entry of sorted) {
      if (!uniq.has(entry.card.id)) uniq.set(entry.card.id, entry.card);
    }
    return [...uniq.values()];
  }, [selectedPack]);

  const dropTable = useMemo(
    () => (selectedPack ? getPackDropTable(selectedPack.id) : []),
    [selectedPack?.id],
  );

  const activeDropEntry = useMemo(() => {
    if (!activePullCard) return undefined;
    return dropTable.find((entry) => entry.card.id === activePullCard.id);
  }, [activePullCard, dropTable]);

  const activeVaultCard = useMemo((): VaultedCard | null => {
    if (!activePullCard || !activeVaultItemId) return null;
    return {
      vaultId: activeVaultItemId,
      id: activePullCard.id,
      name: activePullCard.name,
      rarity: activePullCard.rarity,
      value: activePullCard.value,
      image: activePullCard.image,
      acquiredAt: new Date().toISOString(),
      status: "vaulted",
    };
  }, [activePullCard, activeVaultItemId]);

  const canShipActive = activePullCard ? canShipCardValue(activePullCard.value) : false;

  const smartDepositUsd = useMemo(() => {
    if (!selectedPack || isGuest) return undefined;
    const packTotalCost = selectedPack.cost * quantity;
    if (goldVolts >= packTotalCost) return undefined;
    return defaultDepositUsdForShortfall(gemsToUsd(packTotalCost - goldVolts));
  }, [selectedPack, isGuest, goldVolts, quantity]);

  const stackPop = useCallback(() => {
    void hapticTabSelect();
    if (window.history.length > 1) {
      navigate(-1);
    }
    goToLobby();
  }, [goToLobby, navigate]);

  const clearCarouselSpin = useCallback(() => {
    if (spinLandTimerRef.current != null) {
      clearTimeout(spinLandTimerRef.current);
      spinLandTimerRef.current = null;
    }
    if (spinnerHapticIntervalRef.current != null) {
      clearInterval(spinnerHapticIntervalRef.current);
      spinnerHapticIntervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearCarouselSpin(), [clearCarouselSpin]);

  const completeReveal = useCallback(() => {
    setPhase("complete");
    setSpinInProgress(false);
  }, [setSpinInProgress]);

  const settleReelGlow = useCallback((fast: boolean) => {
    setReelGlowFast(fast);
    setReelGlowSettled(true);
  }, []);

  const landCarouselSpin = useCallback(() => {
    clearCarouselSpin();
    settleReelGlow(false);
    setIsCarouselSpinning(false);
    void hapticHeavyImpact();
    if (import.meta.env.DEV) {
      console.log("[SpinnerHaptic] land");
    }
    window.setTimeout(() => {
      completeReveal();
    }, 400);
  }, [clearCarouselSpin, completeReveal, settleReelGlow]);

  const startCarouselSpin = useCallback(() => {
    clearCarouselSpin();
    setReelGlowSettled(false);
    setReelGlowFast(false);
    setSpinKey((key) => key + 1);
    setIsCarouselSpinning(true);
    void hapticSpinnerTick();
    spinnerHapticIntervalRef.current = window.setInterval(() => {
      void hapticSpinnerTick();
    }, SPINNER_HAPTIC_INTERVAL_MS);
    const spinDuration = fastModeRef.current ? FAST_SPIN_DURATION_MS : MOBILE_SPIN_DURATION_MS;
    spinLandTimerRef.current = window.setTimeout(() => {
      landCarouselSpin();
    }, spinDuration + MOBILE_SPIN_LAND_BUFFER_MS);
  }, [clearCarouselSpin, landCarouselSpin]);

  const handleDismiss = useCallback(() => {
    clearCarouselSpin();
    setIsCarouselSpinning(false);
    setSpinInProgress(false);
    setShipSheetOpen(false);
    stackPop();
  }, [clearCarouselSpin, setSpinInProgress, stackPop]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      clearCarouselSpin();
    };
  }, [clearCarouselSpin]);

  useEffect(() => {
    if (!selectedPack) return;
    clearCarouselSpin();
    setPhase("pre-rip");
    setPullQueue([]);
    setQueueIndex(0);
    setPullVaultIds([]);
    setTransactionFailureOpen(false);
    setWhatsInsideOpen(false);
    setCompleteInfoOpen(false);
    setRevealStoreRarity("Common");
    setCarouselCards([]);
    setIsCarouselSpinning(false);
    setReelGlowSettled(false);
    setReelGlowFast(false);
    setSpinKey(0);
    void buildPendingFairnessSession(selectedPack.id).then(setFairnessSession);
  }, [clearCarouselSpin, selectedPack?.id]);

  const executeRip = useCallback(async (): Promise<RipResult> => {
    if (!selectedPack) return { ok: false };

    const totalCost = selectedPack.cost * quantity;

    if (!isGuest && userId && goldVolts < totalCost) {
      showErrorToast("Add funds to open this pack.");
      pendingSpinAfterDeposit.current = true;
      setAddFundsOpen(true);
      setAddFundsModalOpen(true);
      return { ok: false };
    }

    try {
      const vaultIds: string[] = [];
      let pullEntries: PackPullEntry[] = [];

      if (!isGuest && userId) {
        setSpinInProgress(true);
        const openResult = await openPack(
          selectedPack.id,
          selectedPack.cost,
          quantity,
          userId,
        );
        if (!openResult.ok) {
          setSpinInProgress(false);
          showErrorToast(openResult.error);
          setTransactionFailureOpen(true);
          return { ok: false };
        }

        setGoldVolts(openResult.gemsBalance);
        pullEntries = openResult.winners.map((winner) => ({
          itemId: winner.itemId,
          rolledNumber: 0,
          serverItemName: winner.itemName,
          serverImageUrl: winner.imageUrl,
          serverGemValue: winner.gemValue,
          serverStoreRarity: winner.storeRarity,
        }));

        for (const winner of openResult.winners) {
          const cardData = cardFromServerWinner(selectedPack.id, winner);
          appendVaultPullFromSpin({
            vaultId: winner.vaultItemId,
            id: cardData.id,
            name: cardData.name,
            rarity: cardData.rarity,
            value: cardData.value,
            image: cardData.image,
            acquiredAt: new Date().toISOString(),
            status: "vaulted",
          });
          vaultIds.push(winner.vaultItemId);
        }

        void commitFairnessSession(selectedPack.id, 0, fairnessSession).then(setFairnessSession);
      } else {
        const rollResults = rollMultipleWithRoll(quantity, selectedPack.id);
        pullEntries = rollResults.map((result) => ({
          itemId: result.card.id,
          rolledNumber: result.rolledNumber,
        }));
        void commitFairnessSession(
          selectedPack.id,
          rollResults[0]!.rolledNumber,
          fairnessSession,
        ).then(setFairnessSession);
      }

      const historyUserId = userId;
      if (historyUserId) {
        for (const entry of pullEntries) {
          const cardData = cardFromPullEntry(selectedPack.id, entry);
          void recordPlayHistory({
            userId: historyUserId,
            packName: selectedPack.name,
            spinCost: selectedPack.cost,
            wonItemName: cardData.name,
            wonItemValue: cardData.value,
            wonItemImage: cardData.image,
            rolledNumber: entry.rolledNumber,
          });
        }
      }

      return { ok: true, entries: pullEntries, vaultIds };
    } catch (ripError) {
      console.error("[OpenPack] executeRip failed", ripError);
      setTransactionFailureOpen(true);
      return { ok: false };
    }
  }, [
    selectedPack,
    isGuest,
    userId,
    goldVolts,
    fairnessSession,
    quantity,
    showErrorToast,
    setGoldVolts,
    appendVaultPullFromSpin,
    setSpinInProgress,
    setAddFundsModalOpen,
  ]);

  const beginSpinSequence = useCallback(
    (entries: PackPullEntry[], vaultIds: string[]) => {
      if (!selectedPack || entries.length === 0) return;

      const firstEntry = entries[0]!;
      const firstCard = cardFromPullEntry(selectedPack.id, firstEntry);
      const { strip } = buildFullDropTableStrip(firstCard, selectedPack.id);
      preloadWinnerArt(strip, ROULETTE_WINNER_INDEX);

      setPullQueue(entries);
      setQueueIndex(0);
      setPullVaultIds(vaultIds);
      setRevealStoreRarity(resolveStoreRarityForEntry(firstEntry, firstCard, dropTable));
      setCarouselCards(strip);
      setPhase("spinning");
      startCarouselSpin();
    },
    [dropTable, selectedPack, startCarouselSpin],
  );

  const handleOpenPack = useCallback(async () => {
    if (!selectedPack || phase !== "pre-rip" || isChargingSpin) return;

    void hapticTabSelect();
    // Spinner audio deferred — web uses SoundManager; mobile reveal is visual + haptics only.
    setIsChargingSpin(true);

    try {
      const result = await executeRip();
      if (!result.ok) {
        setSpinInProgress(false);
        return;
      }
      beginSpinSequence(result.entries, result.vaultIds);
      if (userId) {
        void syncGemBalanceFromServer(userId);
      }
    } catch (openPackError) {
      console.error("[OpenPack] handleOpenPack failed", openPackError);
      setSpinInProgress(false);
    } finally {
      setIsChargingSpin(false);
    }
  }, [
    selectedPack,
    phase,
    isChargingSpin,
    executeRip,
    beginSpinSequence,
    setSpinInProgress,
    userId,
    syncGemBalanceFromServer,
  ]);

  const finishReveal = useCallback(() => {
    clearCarouselSpin();
    setIsCarouselSpinning(false);

    if (queueIndex < pullQueue.length - 1 && selectedPack) {
      const nextIndex = queueIndex + 1;
      const nextEntry = pullQueue[nextIndex]!;
      const nextCard = cardFromPullEntry(selectedPack.id, nextEntry);
      const { strip } = buildFullDropTableStrip(nextCard, selectedPack.id);
      preloadWinnerArt(strip, ROULETTE_WINNER_INDEX);

      setQueueIndex(nextIndex);
      setRevealStoreRarity(resolveStoreRarityForEntry(nextEntry, nextCard, dropTable));
      setCarouselCards(strip);
      setPhase("spinning");
      startCarouselSpin();
      return;
    }

    setPullQueue([]);
    setQueueIndex(0);
    setPullVaultIds([]);
    setPhase("pre-rip");
    setShipSheetOpen(false);
    setSpinInProgress(false);
    stackPop();
  }, [
    clearCarouselSpin,
    pullQueue,
    queueIndex,
    selectedPack,
    setSpinInProgress,
    stackPop,
    dropTable,
    startCarouselSpin,
  ]);

  const handleSendToVault = useCallback(() => {
    if (!activePullCard || isGuest) return;
    showCashoutToast(`${activePullCard.name} secured in your vault.`);
    finishReveal();
  }, [activePullCard, isGuest, showCashoutToast, finishReveal]);

  const handleShip = useCallback(() => {
    if (!activeVaultItemId) {
      showErrorToast("This pull is still being secured. Try again shortly.");
      return;
    }
    if (!canShipActive) {
      showErrorToast("Cards under $50 auto-sell only");
      return;
    }
    void hapticTabSelect();
    setShipSheetOpen(true);
  }, [activeVaultItemId, canShipActive, showErrorToast]);

  // Retained with ShipCardSheet — shipping is available from the Vault tab; result screen no longer exposes it.
  void handleShip;

  if (!selectedPack) {
    return null;
  }

  const totalCost = selectedPack.cost * quantity;

  const openLabel = isChargingSpin
    ? "Processing…"
    : isGuest
      ? "Demo Open Pack"
      : `Open Pack · ${formatPackPriceUsd(totalCost)}`;

  const showPack = phase === "pre-rip";
  const showSpinner = phase === "spinning";
  const showComplete = phase === "complete" && activePullCard;

  const reelRarityGlow = glowPaletteForStoreRarity(revealStoreRarity);

  const effectiveSpinDurationMs = fastMode ? FAST_SPIN_DURATION_MS : MOBILE_SPIN_DURATION_MS;

  const expectedValueLabel = formatPackExpectedValueUsd(selectedPack.id);

  // Most valuable pullable card — same deduped/value-sorted pool the EV reads.
  const topHit = insideCards[0] ?? null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-[#0a0c10]" aria-hidden />
      <motion.div
        className="rip-ambient-bg fixed inset-0 z-[101] flex flex-col overflow-hidden bg-[#0a0c10]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={PAGE_STACK_SPRING}
      >
        {phase === "spinning" ? (
          <header
            className="relative z-50 shrink-0 px-6 pb-3"
            style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.5rem)" }}
          >
            {!isCarouselSpinning ? (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Close"
                className="absolute right-6 top-[max(0.5rem,env(safe-area-inset-top))] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--rip-surface)] text-lg leading-none text-white"
              >
                ×
              </button>
            ) : null}
            <div className="px-10 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--rip-text-muted)]">
                Opening
              </p>
              <h2
                className="mt-1 text-[22px] font-bold leading-tight text-white"
                style={{
                  textShadow: reelGlowSettled
                    ? `0 0 28px rgba(${reelRarityGlow.rgb}, 0.7)`
                    : "0 0 22px rgba(255, 122, 0, 0.35)",
                  transition: "text-shadow 320ms ease",
                }}
              >
                {selectedPack.name}
              </h2>
            </div>
          </header>
        ) : phase === "complete" ? (
          <header
            className="relative z-50 flex shrink-0 items-center justify-between px-6 pb-3"
            style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.5rem)" }}
          >
            <button
              type="button"
              onClick={() => {
                void hapticTabSelect();
                finishReveal();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rip-surface)] text-white"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => {
                void hapticTabSelect();
                setCompleteInfoOpen(true);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rip-surface)] text-white"
              aria-label="Card info"
            >
              <InfoIcon size={20} />
            </button>
          </header>
        ) : (
          <DismissPill
            onClick={handleDismiss}
            className="absolute right-6 z-50 opacity-100"
            style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
          />
        )}

        <MobileErrorBoundary label="Pack opening failed">
          <div
            className={`relative z-10 flex min-h-0 flex-1 flex-col items-center p-0 ${
              showComplete
                ? "overflow-visible"
                : showPack
                  ? "overflow-y-auto overflow-x-hidden"
                  : "overflow-hidden"
            } ${showComplete || showPack ? "" : "justify-center"}`}
          >
            <AnimatePresence mode="wait">
              {showPack ? (
                <motion.div
                  key="sealed-pack"
                  className="flex w-full max-w-[480px] flex-col px-6"
                  style={{
                    paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 3.25rem)",
                    paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.96,
                    transition: { type: "spring", stiffness: 300, damping: 28 },
                  }}
                >
                  <h1 className="text-center text-[24px] font-bold leading-tight text-white">
                    {selectedPack.name}
                  </h1>

                  <div className="mt-4 flex justify-center">
                    <GlassSurface
                      variant="default"
                      className="relative aspect-[3/4] w-[min(58vw,240px)] overflow-hidden rounded-2xl p-0"
                    >
                      <div className="relative h-full w-full">
                        <PackCatalogImage
                          packId={selectedPack.id}
                          src={selectedPack.image}
                          alt={selectedPack.name}
                          priority
                        />
                      </div>
                    </GlassSurface>
                  </div>

                  <div className="mt-6 flex gap-2">
                    {[1, 2, 3, 4, 5].map((q) => {
                      const active = quantity === q;
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => {
                            void hapticTabSelect();
                            setQuantity(q);
                          }}
                          className={`h-11 flex-1 rounded-full text-[15px] font-bold transition-colors ${
                            active
                              ? "bg-[var(--rip-orange)] text-white"
                              : "bg-[var(--rip-surface)] text-[var(--rip-text-muted)]"
                          }`}
                        >
                          {q}x
                        </button>
                      );
                    })}
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void handleOpenPack()}
                    disabled={isChargingSpin}
                    className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[var(--rip-orange)] text-[16px] font-bold text-white transition-transform active:scale-[0.98] active:bg-[var(--rip-orange-pressed)] disabled:opacity-40"
                  >
                    {openLabel}
                  </motion.button>

                  <p className="mt-3 text-center text-[13px] leading-relaxed text-[var(--rip-text-muted)]">
                    Each pack contains one graded card — ship it to your door, or sell it back at
                    85% of Fair Market Value with our buyback guarantee.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      void hapticTabSelect();
                      setAdjustOddsOpen(true);
                    }}
                    className="mt-5 flex w-full items-center justify-between rounded-2xl border border-[var(--rip-border)] bg-[var(--rip-surface)] px-4 py-3.5 active:bg-white/5"
                  >
                    <span className="text-[15px] font-semibold text-white">Top Hit</span>
                    <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--rip-green-bright)]">
                      {topHit ? formatUsd(gemsToUsd(topHit.value)) : expectedValueLabel}
                      <ChevronRight size={18} className="text-[var(--rip-text-muted)]" />
                    </span>
                  </button>

                  {insideCards.length > 0 ? (
                    <section className="mt-8">
                      <h3 className="text-[18px] font-bold text-white">What&apos;s Inside</h3>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {insideCards.slice(0, INSIDE_GRID_PREVIEW).map((card) => (
                          <RipCardTile key={card.id} card={card} className="!w-full" />
                        ))}
                      </div>
                      {insideCards.length > INSIDE_GRID_PREVIEW ? (
                        <button
                          type="button"
                          onClick={() => {
                            void hapticTabSelect();
                            setWhatsInsideOpen(true);
                          }}
                          className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-[var(--rip-border)] bg-transparent text-[15px] font-semibold text-white active:bg-white/5"
                        >
                          Show all {insideCards.length}
                        </button>
                      ) : null}
                    </section>
                  ) : null}
                </motion.div>
              ) : null}

              {showSpinner ? (
                <motion.div
                  key={`spin-${spinKey}`}
                  className="flex min-h-0 w-full flex-1 flex-col justify-center px-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={SPINNER_EXIT_TRANSITION}
                >
                  <div
                    className="mobile-spinner-wrapper relative w-full max-w-full"
                    data-glow-settled={reelGlowSettled ? true : undefined}
                    data-glow-fast={reelGlowFast ? true : undefined}
                    style={
                      {
                        "--spin-needle-color": reelGlowSettled
                          ? reelRarityGlow.needle
                          : "var(--rip-orange)",
                      } as CSSProperties
                    }
                  >
                    <SpinStageAtmosphere
                      settled={reelGlowSettled}
                      fastTransition={reelGlowFast}
                      rarityGlow={reelRarityGlow}
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[8%] bg-gradient-to-r from-[var(--rip-bg-primary)] to-transparent"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 right-0 z-30 w-[8%] bg-gradient-to-l from-[var(--rip-bg-primary)] to-transparent"
                      aria-hidden
                    />
                    <div className="relative z-10 w-full">
                      <UnboxingCarousel
                        cards={carouselCards}
                        isSpinning={isCarouselSpinning}
                        winnerIndex={ROULETTE_WINNER_INDEX}
                        spinDurationMs={effectiveSpinDurationMs}
                        cardWidth={MOBILE_SPIN_CARD_WIDTH}
                        compactCards
                        suppressEdgeFades
                      />
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {showComplete ? (
                <motion.div
                  key={`won-${queueIndex}-${activePullCard.id}`}
                  data-store-rarity={revealStoreRarity}
                  className="flex min-h-0 w-full flex-1 flex-col px-6"
                  variants={{
                    initial: { opacity: 0, scale: 0.92 },
                    animate: {
                      opacity: 1,
                      scale: 1,
                      transition: COMPLETE_ENTER_TRANSITION,
                    },
                    exit: {
                      opacity: 0,
                      scale: 0.92,
                      transition: COMPLETE_EXIT_TRANSITION,
                    },
                  }}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="flex min-h-0 flex-[0.65] flex-col items-center justify-center">
                    <RevealStage card={activePullCard} rarity={revealStoreRarity} />
                  </div>

                  <motion.div
                    className="mt-8 shrink-0 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...BUTTON_SPRING, delay: 0.25 }}
                  >
                    <RarityBadge rarity={revealStoreRarity} palette={reelRarityGlow} />
                    <p className="mt-3 text-[24px] font-semibold text-white">{activePullCard.name}</p>
                    <CountUpValue
                      valueGems={activePullCard.value}
                      className="rip-glow-price-green mt-1 block text-[32px] font-bold tabular-nums text-[var(--rip-green-bright)]"
                    />
                    {activeDropEntry ? (
                      <p className="mt-1 text-[13px] text-[var(--rip-text-muted)]">
                        {formatProbability(activeDropEntry.probability)} chance
                      </p>
                    ) : null}
                  </motion.div>

                  <motion.div
                    className="mt-auto w-full shrink-0 pt-8"
                    style={{
                      paddingBottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={BUTTON_SPRING}
                  >
                    {isGuest ? (
                      <button
                        type="button"
                        onClick={finishReveal}
                        className={`${COMPLETE_ACTION_BTN} w-full bg-[var(--rip-orange)] text-white active:bg-[var(--rip-orange-pressed)]`}
                      >
                        {pullQueue.length > 1 && queueIndex < pullQueue.length - 1
                          ? "Next Pull"
                          : "Done"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendToVault}
                        className={`${COMPLETE_ACTION_BTN} w-full bg-[var(--rip-orange)] text-white active:bg-[var(--rip-orange-pressed)]`}
                      >
                        {pullQueue.length > 1 && queueIndex < pullQueue.length - 1
                          ? "Next Pull"
                          : "Send to Vault"}
                      </button>
                    )}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </MobileErrorBoundary>

      </motion.div>

      <MobileWhatsInsideDrawer
        packId={selectedPack.id}
        packName={selectedPack.name}
        open={whatsInsideOpen}
        onClose={() => setWhatsInsideOpen(false)}
      />

      <AdjustOddsSheet
        pack={selectedPack}
        open={adjustOddsOpen}
        onClose={() => setAdjustOddsOpen(false)}
        showVolatility={false}
        expectedValueUsd={expectedValueLabel}
        zIndex={120}
        topHit={
          topHit
            ? { name: topHit.name, value: topHit.value, image: topHit.image }
            : undefined
        }
      />

      <ShipCardSheet
        open={shipSheetOpen}
        onClose={() => setShipSheetOpen(false)}
        card={activeVaultCard}
        onSuccess={finishReveal}
      />

      <AddFundsModal
        open={addFundsOpen}
        defaultAmountUsd={smartDepositUsd}
        onSuccess={() => {
          if (pendingSpinAfterDeposit.current) {
            pendingSpinAfterDeposit.current = false;
            void handleOpenPack();
          }
        }}
        onClose={() => {
          pendingSpinAfterDeposit.current = false;
          setAddFundsOpen(false);
          setAddFundsModalOpen(false);
        }}
      />

      {transactionFailureOpen ? (
        <TransactionFailureModal onClose={() => setTransactionFailureOpen(false)} />
      ) : null}

      <RipBottomSheet open={completeInfoOpen} onClose={() => setCompleteInfoOpen(false)} heightClass="h-auto max-h-[50dvh]">
        {activePullCard ? (
          <div className="px-6 pb-8 pt-14">
            <h3 className="text-xl font-bold text-white">Card details</h3>
            <dl className="mt-4 space-y-3 text-[15px]">
              <div>
                <dt className="text-[var(--rip-text-muted)]">Name</dt>
                <dd className="text-white">{activePullCard.name}</dd>
              </div>
              <div>
                <dt className="text-[var(--rip-text-muted)]">Rarity</dt>
                <dd className="text-white">{activePullCard.rarity}</dd>
              </div>
              <div>
                <dt className="text-[var(--rip-text-muted)]">Fair market value</dt>
                <dd className="text-white">{formatUsd(gemsToUsd(activePullCard.value))}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </RipBottomSheet>
    </>
  );
}
