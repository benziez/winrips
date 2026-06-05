import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { auditCollectibleImageSources } from "../../utils/collectibleImageSrc";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { recordPlayHistory, fetchPlayHistory } from "../../lib/playHistory";
import { requestAppReview } from "../../lib/requestAppReview";
import { openPack } from "../../lib/spinLogic";
import {
  buildFullDropTableStrip,
  cardFromPullEntry,
  rollMultipleWithRoll,
  rollTopValueCardForPack,
  ROULETTE_WINNER_INDEX,
  type PackPullEntry,
} from "../../utils/rng";
import { formatPackPriceUsd, formatUsd, gemsToUsd, canShipCardValue } from "../../constants/retail";
import { formatPackExpectedValueUsd } from "../../utils/packValueRange";
import { getPackDetailDescription } from "../../constants/packDescriptions";
import { AddFundsModal, defaultDepositUsdForShortfall } from "./rip/AddFundsModal";
import { AdjustOddsSheet } from "./rip/AdjustOddsSheet";
import {
  isRiskyRipOddsMode,
  type OddsMode,
} from "./rip/adjustOdds";
import { RipCardTile } from "./rip/RipCardTile";
import { PackCatalogImage } from "./PackCatalogImage";
import { UnboxingCarousel } from "../pack-opening/UnboxingCarousel";
import { SpinStageAtmosphere } from "../pack-opening/SpinStageAtmosphere";
import { glowPaletteForStoreRarity, type RarityGlowPalette } from "../../utils/rarityGlowColors";
import { MobileWhatsInsideDrawer } from "./MobileWhatsInsideDrawer";
import { hapticHeavyImpact, hapticSpinnerTick, hapticTabSelect } from "../../utils/mobileHaptics";
import { preloadSpinnerStripImages } from "../../utils/spinnerImagePreload";
import { isFastModeEnabled } from "../../lib/mobileRipPreferences";
import {
  buildPendingFairnessSession,
  commitFairnessSession,
  type FairnessSession,
} from "../../utils/provablyFair";
import { formatProbability, getPackDropTable } from "../../data/packDropTables";
import type { StoreRarity } from "../../types/store";
import type { Card, VaultedCard } from "../../types";
import { CollectibleImage } from "../ui/CollectibleImage";
import { ChevronLeft, ChevronRight } from "../icons/AppIcons";
import { PAGE_STACK_SPRING } from "./mobileTheme";
import {
  OVERLAY_DISMISS_EXIT,
  OVERLAY_DISMISS_TRANSITION,
} from "./rip/ripMotion";
import { MobileErrorBoundary } from "./MobileErrorBoundary";
import { DismissPill } from "./DismissPill";
import { GlassSurface } from "./GlassSurface";
import { ShipCardSheet } from "./vault/ShipCardSheet";
import { isGuestDemoSpinAvailable, markGuestDemoSpinUsed } from "../../constants/guestDemoSpin";
import { getLimitedDropOpenBlockMessage } from "../../utils/limitedDropWindows";
import { getPackRollPool } from "../../data/boxCatalog";
import type { StoreItem } from "../../types/store";
import { JustPulledHorizontalFeed } from "./JustPulledHorizontalFeed";
import type { JustPulledFeedTile } from "./JustPulledFeedCard";
import StarField, { getStarFieldBackground, getPackPriceTier } from "./StarField";

type OpenPhase = "pre-rip" | "spinning" | "complete";

const BUTTON_SPRING = { type: "spring" as const, stiffness: 500, damping: 26 };
const INSIDE_GRID_PREVIEW = 6;
const PACK_JUST_PULLED_LIMIT = 8;
const PACK_JUST_PULLED_TICK_MS = 3_000;
const SIM_PULL_POOL_MIN = 15;
const SIM_PULL_POOL_MAX = 20;
const SIM_SEED_AGES_SEC = [2, 9, 19, 34, 48, 55, 58, 60];
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

/** 15–20 unique cards from the pack roll pool — source for simulated Just Pulled tiles. */
function buildSimPullPool(packId: string): StoreItem[] {
  const rollPool = getPackRollPool(packId);
  const unique = [...new Map(rollPool.map((item) => [item.id, item])).values()];
  if (unique.length === 0) return [];

  const target = Math.min(
    unique.length,
    SIM_PULL_POOL_MIN + Math.floor(Math.random() * (SIM_PULL_POOL_MAX - SIM_PULL_POOL_MIN + 1)),
  );

  const shuffled = [...unique];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  return shuffled.slice(0, target);
}

function spawnSimPullTile(
  pool: StoreItem[],
  packId: string,
  seq: number,
  ageSec: number,
): JustPulledFeedTile {
  const item = pool[Math.floor(Math.random() * pool.length)]!;
  return {
    key: `sim-${packId}-${seq}`,
    name: item.name,
    value: item.value,
    image: item.image ?? "",
    rarity: item.appRarity,
    acquiredAt: new Date(Date.now() - ageSec * 1000).toISOString(),
  };
}

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

const SPIN_PRELOAD_LEAD = 20;

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
            key={`reveal-${card.id}-${card.image}`}
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
    isLoggedIn,
    appendVaultPullFromSpin,
    setSpinInProgress,
    syncGemBalanceFromServer,
    setAddFundsModalOpen,
    openAuthModal,
    authModalOpen,
  } = useApp();
  const { isAuthenticated } = useAuth();
  const isGuest = !isLoggedIn;

  const [phase, setPhase] = useState<OpenPhase>("pre-rip");
  const [isChargingSpin, setIsChargingSpin] = useState(false);
  const [pullQueue, setPullQueue] = useState<PackPullEntry[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [pullVaultIds, setPullVaultIds] = useState<string[]>([]);
  const [fairnessSession, setFairnessSession] = useState<FairnessSession | null>(null);
  const [isPresent, setIsPresent] = useState(true);
  const [whatsInsideOpen, setWhatsInsideOpen] = useState(false);
  const [adjustOddsOpen, setAdjustOddsOpen] = useState(false);
  const [oddsMode, setOddsMode] = useState<OddsMode>("normal");
  const [revealStoreRarity, setRevealStoreRarity] = useState<StoreRarity>("Common");
  const [carouselCards, setCarouselCards] = useState<Card[]>([]);
  const [isCarouselSpinning, setIsCarouselSpinning] = useState(false);
  const [isPreparingPull, setIsPreparingPull] = useState(false);
  const [preloadedImagesBySlot, setPreloadedImagesBySlot] = useState<
    Map<number, HTMLImageElement>
  >(() => new Map());
  const [preloadedImagesByUrl, setPreloadedImagesByUrl] = useState<
    Map<string, HTMLImageElement>
  >(() => new Map());
  const [spinKey, setSpinKey] = useState(0);
  const [shipSheetOpen, setShipSheetOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [reelGlowSettled, setReelGlowSettled] = useState(false);
  const [reelGlowFast, setReelGlowFast] = useState(false);
  const [isGuestDemoSpin, setIsGuestDemoSpin] = useState(false);
  const pendingSpinAfterDeposit = useRef(false);
  const isGuestDemoSpinRef = useRef(false);

  const pendingLobbyRedirectAfterAuthRef = useRef(false);
  const packsOpenedCountRef = useRef(0);
  const reviewPromptPendingRef = useRef(false);

  const spinLandTimerRef = useRef<number | null>(null);
  const spinnerHapticIntervalRef = useRef<number | null>(null);
  const spinPreloadPinsRef = useRef<HTMLImageElement[]>([]);
  const spinPrepareCancelledRef = useRef(false);

  const [quantity, setQuantity] = useState(1);
  const [dropWindowNow, setDropWindowNow] = useState(() => Date.now());
  const [packJustPulled, setPackJustPulled] = useState<JustPulledFeedTile[]>([]);
  const simPullPoolRef = useRef<StoreItem[]>([]);
  const simPullSeqRef = useRef(0);
  // Fast Mode is set in Account; read the persisted pref on mount so each open honors it.
  const [fastMode] = useState(() => isFastModeEnabled());
  const fastModeRef = useRef(fastMode);
  useEffect(() => {
    fastModeRef.current = fastMode;
  }, [fastMode]);

  useEffect(() => {
    const clockId = window.setInterval(() => {
      setDropWindowNow(Date.now());
    }, 1_000);

    return () => window.clearInterval(clockId);
  }, []);

  useEffect(() => {
    if (!selectedPack || phase !== "pre-rip") {
      setPackJustPulled([]);
      simPullPoolRef.current = [];
      return;
    }

    const packId = selectedPack.id;
    const simPool = buildSimPullPool(packId);
    simPullPoolRef.current = simPool;
    if (simPool.length === 0) {
      setPackJustPulled([]);
      return;
    }

    simPullSeqRef.current = 0;
    const seedTiles = SIM_SEED_AGES_SEC.slice(0, PACK_JUST_PULLED_LIMIT).map((ageSec) => {
      simPullSeqRef.current += 1;
      return spawnSimPullTile(simPool, packId, simPullSeqRef.current, ageSec);
    });
    setPackJustPulled(seedTiles);

    const intervalId = window.setInterval(() => {
      const pool = simPullPoolRef.current;
      if (pool.length === 0) return;

      simPullSeqRef.current += 1;
      const fresh = spawnSimPullTile(pool, packId, simPullSeqRef.current, 0);
      setPackJustPulled((prev) => [fresh, ...prev].slice(0, PACK_JUST_PULLED_LIMIT));
    }, PACK_JUST_PULLED_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [selectedPack, phase]);

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

  const completeDismiss = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    }
  }, [navigate]);

  const stackPop = useCallback(() => {
    void hapticTabSelect();
    goToLobby();
    setIsPresent(false);
  }, [goToLobby]);

  const dismissPackOpenOnError = useCallback(
    (message = "Could not open pack.") => {
      setSpinInProgress(false);
      setIsChargingSpin(false);
      showErrorToast(message);
      goToLobby();
      setIsPresent(false);
    },
    [goToLobby, setSpinInProgress, showErrorToast],
  );

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

  useEffect(() => {
    return () => {
      spinPrepareCancelledRef.current = true;
    };
  }, []);

  const completeReveal = useCallback(() => {
    setPhase("complete");
    setSpinInProgress(false);

    if (
      reviewPromptPendingRef.current &&
      !isGuestDemoSpinRef.current &&
      !isGuest &&
      packsOpenedCountRef.current === 3
    ) {
      reviewPromptPendingRef.current = false;
      void requestAppReview();
    }
  }, [isGuest, setSpinInProgress]);

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
    spinPrepareCancelledRef.current = true;
    clearCarouselSpin();
    setIsCarouselSpinning(false);
    setIsPreparingPull(false);
    setSpinInProgress(false);
    setShipSheetOpen(false);
    setIsGuestDemoSpin(false);
    isGuestDemoSpinRef.current = false;
    stackPop();
  }, [clearCarouselSpin, setSpinInProgress, stackPop]);

  useEffect(() => {
    if (!userId || isGuest) {
      packsOpenedCountRef.current = 0;
      return;
    }

    let cancelled = false;
    void fetchPlayHistory(userId, 100).then((rows) => {
      if (!cancelled) packsOpenedCountRef.current = rows.length;
    });

    return () => {
      cancelled = true;
    };
  }, [userId, isGuest]);

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
    setWhatsInsideOpen(false);
    setRevealStoreRarity("Common");
    setCarouselCards([]);
    setIsCarouselSpinning(false);
    setReelGlowSettled(false);
    setReelGlowFast(false);
    setSpinKey(0);
    setIsGuestDemoSpin(false);
    isGuestDemoSpinRef.current = false;
    setOddsMode("normal");
    void buildPendingFairnessSession(selectedPack.id).then(setFairnessSession);
  }, [clearCarouselSpin, selectedPack?.id]);

  useEffect(() => {
    if (!pendingLobbyRedirectAfterAuthRef.current) return;
    if (!isAuthenticated || !isLoggedIn) return;

    pendingLobbyRedirectAfterAuthRef.current = false;
    isGuestDemoSpinRef.current = false;
    setIsGuestDemoSpin(false);
    setSpinInProgress(false);
    goToLobby();
  }, [goToLobby, isAuthenticated, isLoggedIn, setSpinInProgress]);

  useEffect(() => {
    if (authModalOpen || !pendingLobbyRedirectAfterAuthRef.current) return;
    if (isAuthenticated && isLoggedIn) return;
    pendingLobbyRedirectAfterAuthRef.current = false;
  }, [authModalOpen, isAuthenticated, isLoggedIn]);

  const executeRip = useCallback(async (
    spinQuantity = quantity,
    options?: { forceTopValueCard?: boolean },
  ): Promise<RipResult> => {
    console.log("[OpenPack] executeRip called", {
      packId: selectedPack?.id,
      spinQuantity,
      isGuest,
      userId: userId ?? null,
      forceTopValueCard: options?.forceTopValueCard ?? false,
    });

    if (!selectedPack) {
      console.warn("[OpenPack] executeRip early exit: no selectedPack");
      return { ok: false };
    }

    const totalCost = selectedPack.cost * spinQuantity;

    if (!isGuest && userId && goldVolts < totalCost) {
      console.warn("[OpenPack] executeRip early exit: insufficient balance", {
        goldVolts,
        totalCost,
      });
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
        console.log("[OpenPack] executeRip calling openPack RPC…", {
          packId: selectedPack.id,
          spinQuantity,
          spinCost: selectedPack.cost,
          riskyRip: isRiskyRipOddsMode(oddsMode),
        });
        const openResult = await openPack(
          selectedPack.id,
          selectedPack.cost,
          spinQuantity,
          userId,
          isRiskyRipOddsMode(oddsMode),
        );
        if (!openResult.ok) {
          console.error("[OpenPack] openPack RPC rejected:", {
            error: openResult.error,
            code: openResult.code,
            step: openResult.step,
            rpcData: openResult.rpcData,
            packId: selectedPack.id,
          });
          dismissPackOpenOnError(openResult.error);
          return { ok: false };
        }
        console.log("[OpenPack] openPack RPC success", {
          packId: selectedPack.id,
          winnerCount: openResult.winners.length,
          gemsBalance: openResult.gemsBalance,
        });

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
        const rollResults = options?.forceTopValueCard
          ? Array.from({ length: spinQuantity }, () => rollTopValueCardForPack(selectedPack.id))
          : rollMultipleWithRoll(spinQuantity, selectedPack.id, {
              riskyRip: isRiskyRipOddsMode(oddsMode),
            });
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
        const packsOpenedBefore = packsOpenedCountRef.current;
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
        packsOpenedCountRef.current = packsOpenedBefore + pullEntries.length;
        if (packsOpenedBefore < 3 && packsOpenedCountRef.current >= 3) {
          reviewPromptPendingRef.current = true;
        }
      }

      console.log("[OpenPack] executeRip completed", {
        packId: selectedPack.id,
        pullCount: pullEntries.length,
      });
      return { ok: true, entries: pullEntries, vaultIds };
    } catch (ripError) {
      console.error("[OpenPack] executeRip threw:", ripError);
      if (ripError && typeof ripError === "object") {
        console.error("[OpenPack] executeRip error details:", {
          ...ripError,
          message: ripError instanceof Error ? ripError.message : String(ripError),
          stack: ripError instanceof Error ? ripError.stack : undefined,
        });
      }
      dismissPackOpenOnError();
      return { ok: false };
    }
  }, [
    selectedPack,
    isGuest,
    isLoggedIn,
    userId,
    goldVolts,
    fairnessSession,
    quantity,
    oddsMode,
    dismissPackOpenOnError,
    setGoldVolts,
    appendVaultPullFromSpin,
    setSpinInProgress,
    setAddFundsModalOpen,
  ]);

  const prepareAndStartCarouselSpin = useCallback(
    async (strip: Card[]) => {
      spinPrepareCancelledRef.current = false;
      setIsPreparingPull(true);
      setIsCarouselSpinning(false);
      setPreloadedImagesBySlot(new Map());

      const preload = await preloadSpinnerStripImages(strip, ROULETTE_WINNER_INDEX, {
        leadCount: SPIN_PRELOAD_LEAD,
        compactMobile: true,
        preloadFullStrip: true,
      });

      if (spinPrepareCancelledRef.current) return;

      spinPreloadPinsRef.current = preload.pinned;
      setPreloadedImagesBySlot(new Map(preload.byIndex));
      setPreloadedImagesByUrl(new Map(preload.byUrl));

      // Do not start CSS spin animation until preload Promise.all has fully settled.
      setIsPreparingPull(false);
      startCarouselSpin();
    },
    [startCarouselSpin],
  );

  const beginSpinSequence = useCallback(
    (entries: PackPullEntry[], vaultIds: string[]) => {
      if (!selectedPack || entries.length === 0) return;

      const firstEntry = entries[0]!;
      const firstCard = cardFromPullEntry(selectedPack.id, firstEntry);
      const { strip } = buildFullDropTableStrip(firstCard, selectedPack.id);
      auditCollectibleImageSources("spin-carousel", strip);

      setPullQueue(entries);
      setQueueIndex(0);
      setPullVaultIds(vaultIds);
      setRevealStoreRarity(resolveStoreRarityForEntry(firstEntry, firstCard, dropTable));
      setCarouselCards(strip);
      setPhase("spinning");
      void prepareAndStartCarouselSpin(strip);
    },
    [dropTable, prepareAndStartCarouselSpin, selectedPack],
  );

  const handleOpenPack = useCallback(async () => {
    console.log("Open Pack clicked, starting executeRip...", {
      packId: selectedPack?.id,
      phase,
      isChargingSpin,
      isGuest,
    });

    if (!selectedPack || phase !== "pre-rip" || isChargingSpin) {
      console.warn("[OpenPack] handleOpenPack early exit: preconditions", {
        hasSelectedPack: Boolean(selectedPack),
        phase,
        isChargingSpin,
      });
      return;
    }

    const limitedDropBlock = getLimitedDropOpenBlockMessage(
      selectedPack.id,
      dropWindowNow,
    );
    if (limitedDropBlock) {
      console.warn("[OpenPack] handleOpenPack early exit: limited drop block", {
        packId: selectedPack.id,
        limitedDropBlock,
      });
      return;
    }

    if (isGuest) {
      void hapticTabSelect();
      if (!isGuestDemoSpinAvailable(selectedPack.id)) {
        openAuthModal("signup");
        return;
      }

      setIsGuestDemoSpin(true);
      isGuestDemoSpinRef.current = true;
      setIsChargingSpin(true);
      setSpinInProgress(true);

      try {
        const result = await executeRip(1, { forceTopValueCard: true });
        if (!result.ok) {
          setSpinInProgress(false);
          setIsGuestDemoSpin(false);
          isGuestDemoSpinRef.current = false;
          return;
        }
        markGuestDemoSpinUsed(selectedPack.id);
        beginSpinSequence(result.entries, result.vaultIds);
      } catch (openPackError) {
        console.error("[OpenPack] guest demo spin failed", openPackError);
        setSpinInProgress(false);
        setIsGuestDemoSpin(false);
        isGuestDemoSpinRef.current = false;
      } finally {
        setIsChargingSpin(false);
      }
      return;
    }

    void hapticTabSelect();
    // Spinner audio deferred — web uses SoundManager; mobile reveal is visual + haptics only.
    setIsChargingSpin(true);

    try {
      const result = await executeRip();
      if (!result.ok) {
        console.warn("[OpenPack] handleOpenPack: executeRip returned ok:false", {
          packId: selectedPack.id,
        });
        return;
      }
      console.log("[OpenPack] handleOpenPack: starting spin sequence", {
        packId: selectedPack.id,
        entryCount: result.entries.length,
      });
      beginSpinSequence(result.entries, result.vaultIds);
      if (userId) {
        void syncGemBalanceFromServer(userId);
      }
    } catch (openPackError) {
      console.error("[OpenPack] handleOpenPack threw:", openPackError);
      if (openPackError && typeof openPackError === "object") {
        console.error("[OpenPack] handleOpenPack error details:", {
          ...openPackError,
          message:
            openPackError instanceof Error
              ? openPackError.message
              : String(openPackError),
          stack: openPackError instanceof Error ? openPackError.stack : undefined,
        });
      }
      dismissPackOpenOnError();
    } finally {
      setIsChargingSpin(false);
    }
  }, [
    selectedPack,
    phase,
    isChargingSpin,
    dropWindowNow,
    executeRip,
    beginSpinSequence,
    dismissPackOpenOnError,
    userId,
    syncGemBalanceFromServer,
    isGuest,
    openAuthModal,
  ]);

  const finishReveal = useCallback(() => {
    clearCarouselSpin();
    setIsCarouselSpinning(false);
    setIsPreparingPull(false);

    if (queueIndex < pullQueue.length - 1 && selectedPack) {
      const nextIndex = queueIndex + 1;
      const nextEntry = pullQueue[nextIndex]!;
      const nextCard = cardFromPullEntry(selectedPack.id, nextEntry);
      const { strip } = buildFullDropTableStrip(nextCard, selectedPack.id);

      setQueueIndex(nextIndex);
      setRevealStoreRarity(resolveStoreRarityForEntry(nextEntry, nextCard, dropTable));
      setCarouselCards(strip);
      setPhase("spinning");
      void prepareAndStartCarouselSpin(strip);
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
    prepareAndStartCarouselSpin,
  ]);

  const handleGuestDemoSignUp = useCallback(() => {
    pendingLobbyRedirectAfterAuthRef.current = true;
    openAuthModal("signup");
  }, [openAuthModal]);

  const handleGuestDemoLogIn = useCallback(() => {
    pendingLobbyRedirectAfterAuthRef.current = true;
    openAuthModal("login");
  }, [openAuthModal]);

  const handleGuestDemoLetItGo = useCallback(() => {
    setIsGuestDemoSpin(false);
    isGuestDemoSpinRef.current = false;
    setSpinInProgress(false);
    stackPop();
  }, [setSpinInProgress, stackPop]);

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
  const limitedDropOpenBlockMessage = getLimitedDropOpenBlockMessage(
    selectedPack.id,
    dropWindowNow,
  );

  const openLabel = isChargingSpin
    ? "Processing…"
    : limitedDropOpenBlockMessage
      ? limitedDropOpenBlockMessage
      : isGuest
        ? isGuestDemoSpinAvailable(selectedPack.id)
          ? "Try Free Open"
          : "Sign Up to Open"
        : `Open Pack · ${formatPackPriceUsd(totalCost)}`;

  const showPack = phase === "pre-rip";
  const showSpinner = phase === "spinning";
  const showComplete = phase === "complete" && activePullCard;
  const showStarField = showSpinner || showComplete;

  const reelRarityGlow = glowPaletteForStoreRarity(revealStoreRarity);

  const effectiveSpinDurationMs = fastMode ? FAST_SPIN_DURATION_MS : MOBILE_SPIN_DURATION_MS;

  const expectedValueLabel = formatPackExpectedValueUsd(selectedPack.id);
  const oddsSheetExpectedValueLabel = formatPackPriceUsd(selectedPack.cost);

  // Most valuable pullable card — same deduped/value-sorted pool the EV reads.
  const topHit = insideCards[0] ?? null;

  const packPriceUsd = gemsToUsd(selectedPack.cost);

  const spinningPackTitleGlow = useMemo((): string | undefined => {
    const tier = getPackPriceTier(packPriceUsd);
    switch (tier) {
      case "elite":
        return "0 0 20px rgba(239, 68, 68, 0.8)";
      case "high":
        return "0 0 20px rgba(251, 191, 36, 0.8)";
      case "mid":
        return "0 0 20px rgba(167, 139, 250, 0.8)";
      default:
        return undefined;
    }
  }, [packPriceUsd]);

  return (
    <>
      <AnimatePresence onExitComplete={completeDismiss}>
        {isPresent ? (
          <>
            <motion.div
              key="pack-open-backdrop"
              className="fixed inset-0 z-[100]"
              style={{ background: showStarField ? getStarFieldBackground(packPriceUsd) : "#000000" }}
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={OVERLAY_DISMISS_TRANSITION}
            />
            <motion.div
              key="pack-open-panel"
              className={`fixed inset-0 z-[101] flex flex-col overflow-hidden ${
                showStarField ? "" : "rip-ambient-bg bg-black"
              }`}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={OVERLAY_DISMISS_EXIT}
              transition={{
                y: PAGE_STACK_SPRING,
                opacity: OVERLAY_DISMISS_TRANSITION,
                default: OVERLAY_DISMISS_TRANSITION,
              }}
            >
        {showStarField ? <StarField packPrice={packPriceUsd} /> : null}
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
              <p className="mb-1 text-xs uppercase tracking-[0.3em] text-gray-400">Opening</p>
              <h2
                key={spinKey}
                className="animate-fade-in text-3xl font-bold leading-tight text-white"
                style={
                  spinningPackTitleGlow ? { textShadow: spinningPackTitleGlow } : undefined
                }
              >
                {selectedPack.name}
              </h2>
            </div>
          </header>
        ) : phase === "complete" ? (
          <header
            className="relative z-50 flex shrink-0 items-center px-6 pb-3"
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
                    {isRiskyRipOddsMode(oddsMode) ? (
                      <div className="risky-rip-pack-frame">
                        <div className="risky-rip-pack-frame__inner">
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
                      </div>
                    ) : (
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
                    )}
                  </div>

                  {!isGuest ? (
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
                  ) : null}

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void handleOpenPack()}
                    disabled={
                      isChargingSpin ||
                      limitedDropOpenBlockMessage !== null
                    }
                    className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[var(--rip-orange)] text-[16px] font-bold text-white transition-transform active:scale-[0.98] active:bg-[var(--rip-orange-pressed)] disabled:opacity-40"
                  >
                    {openLabel}
                  </motion.button>

                  <p className="mt-3 text-center text-[13px] leading-relaxed text-[var(--rip-text-muted)]">
                    {getPackDetailDescription(selectedPack.id)}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      void hapticTabSelect();
                      setAdjustOddsOpen(true);
                    }}
                    className="mt-5 flex w-full items-center justify-between rounded-2xl border border-[var(--rip-border)] bg-[var(--rip-surface)] px-4 py-3.5 active:bg-white/5"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-[15px] font-semibold text-white">Top Hit</span>
                      {isRiskyRipOddsMode(oddsMode) ? (
                        <span className="risky-rip-mode-badge shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-[#ffb3c6]">
                          ⚡ Risky Rip
                        </span>
                      ) : null}
                    </span>
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

                  {packJustPulled.length > 0 ? (
                    <section className="mt-8 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--rip-green-bright)] opacity-50" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--rip-green-bright)]" />
                        </span>
                        <h3 className="text-[18px] font-bold text-white">Just Pulled</h3>
                      </div>
                      <div className="-mx-6">
                        <JustPulledHorizontalFeed
                          tiles={packJustPulled}
                          nowMs={dropWindowNow}
                          paddingStart={24}
                          className="snap-x snap-mandatory scroll-pl-6 pr-6 pb-1"
                        />
                      </div>
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
                      {isPreparingPull ? (
                        <div className="flex min-h-[340px] flex-col items-center justify-center gap-3">
                          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30" />
                          <p className="text-sm font-medium uppercase tracking-[0.35em] text-white/50">
                            Preparing Pull…
                          </p>
                        </div>
                      ) : (
                        <UnboxingCarousel
                          cards={carouselCards}
                          isSpinning={isCarouselSpinning}
                          winnerIndex={ROULETTE_WINNER_INDEX}
                          spinDurationMs={effectiveSpinDurationMs}
                          cardWidth={MOBILE_SPIN_CARD_WIDTH}
                          compactCards
                          suppressEdgeFades
                          preloadedImagesBySlot={preloadedImagesBySlot}
                          preloadedImagesByUrl={preloadedImagesByUrl}
                        />
                      )}
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
                    {isGuestDemoSpin ? (
                      <div className="w-full text-center">
                        <p className="text-[22px] font-bold leading-tight text-white">
                          You could have won this.
                        </p>
                        <div className="mt-5 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleGuestDemoSignUp}
                            className={`${COMPLETE_ACTION_BTN} bg-[#FF007F] text-white shadow-[0_0_24px_rgba(255,0,127,0.35)] active:brightness-110`}
                          >
                            Sign Up
                          </button>
                          <button
                            type="button"
                            onClick={handleGuestDemoLogIn}
                            className={`${COMPLETE_ACTION_BTN} border border-white/20 bg-[var(--rip-surface)] text-white active:bg-white/10`}
                          >
                            Log In
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleGuestDemoLetItGo}
                          className="mt-4 py-2 text-[14px] font-medium text-[var(--rip-text-muted)] active:text-white"
                        >
                          Let it go
                        </button>
                      </div>
                    ) : isGuest ? (
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
              selected={oddsMode}
              onApply={setOddsMode}
              expectedValueUsd={oddsSheetExpectedValueLabel}
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

          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
