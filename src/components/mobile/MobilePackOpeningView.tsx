import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { recordPlayHistory } from "../../lib/playHistory";
import { handleSpin } from "../../lib/spinLogic";
import {
  buildFullDropTableStrip,
  rollMultipleWithRoll,
  resolveCardByItemId,
  ROULETTE_WINNER_INDEX,
  type PackPullEntry,
} from "../../utils/rng";
import { formatPackPriceUsd, formatUsd, gemsToUsd, RETAIL_COPY } from "../../constants/retail";
import { isAppStoreCommerce } from "../../constants/commerce";
import { purchasePackForOpening } from "../../lib/nativePackPurchase";
import { PackCatalogImage } from "./PackCatalogImage";
import { UnboxingCarousel } from "../pack-opening/UnboxingCarousel";
import { MobileWhatsInsideDrawer } from "./MobileWhatsInsideDrawer";
import { hapticHeavyImpact, hapticSpinnerTick, hapticTabSelect } from "../../utils/mobileHaptics";
import {
  buildPendingFairnessSession,
  commitFairnessSession,
  type FairnessSession,
} from "../../utils/provablyFair";
import { TransactionFailureModal } from "../pack-opening/TransactionFailureModal";
import { VaultReleaseModal } from "../shipping/VaultReleaseModal";
import { createVaultReleaseOnConfirm } from "../../lib/vaultReleaseFlow";
import { formatProbability, getPackDropTable } from "../../data/packDropTables";
import type { StoreRarity } from "../../types/store";
import type { Card } from "../../types";
import { CollectibleImage } from "../ui/CollectibleImage";
import { ChevronLeft, InfoIcon } from "../icons/AppIcons";
import { MOBILE_COLORS, BTN_GHOST_OUTLINE, BTN_PRIMARY, PAGE_STACK_SPRING } from "./mobileTheme";
import { MobileErrorBoundary } from "./MobileErrorBoundary";
import { DismissPill } from "./DismissPill";
import { GlassSurface } from "./GlassSurface";
import { RipBottomSheet } from "./rip/RipBottomSheet";

type OpenPhase = "pre-rip" | "spinning" | "complete";

const BUTTON_SPRING = { type: "spring" as const, stiffness: 500, damping: 26 };
const SPINNER_EXIT_TRANSITION = { duration: 0.25 };
const COMPLETE_ENTER_TRANSITION = { duration: 0.4, ease: "easeOut" as const, delay: 0.15 };
const COMPLETE_EXIT_TRANSITION = { duration: 0.4, ease: "easeOut" as const };
const MOBILE_SPIN_DURATION_MS = 6_500;
const MOBILE_SPIN_LAND_BUFFER_MS = 250;
const SPINNER_HAPTIC_INTERVAL_MS = 120;
const MOBILE_SPIN_CARD_WIDTH = 160;

const COMPLETE_ACTION_BTN =
  "flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-semibold transition-opacity active:opacity-80 disabled:opacity-30";

function resolveStoreRarityForCard(
  card: Card | null | undefined,
  dropTable: ReturnType<typeof getPackDropTable>,
): StoreRarity {
  if (!card) return "Common";
  return dropTable.find((entry) => entry.card.id === card.id)?.storeRarity ?? "Common";
}

function TrophyCardHero({ card }: { card: Card }) {
  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-[min(58vw,300px)]"
    >
      <div
        aria-hidden
        className="rip-trophy-halo pointer-events-none absolute left-1/2 top-1/2 z-0 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2"
      />
      <div
        className="pointer-events-none absolute -bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div className="relative z-[1]">
        <CollectibleImage
          src={card.image}
          alt={card.name}
          className="w-full object-contain"
          priority
          optimize={false}
          forceShow
        />
      </div>
    </motion.div>
  );
}

function displayName(name: string): string {
  return name.replace(/ Pack$| Box$| Drop$| Edition$| Booster$/, "");
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
    shippingModalOpen,
    setShippingModalOpen,
    goldVolts,
    userId,
    appendVaultPullFromSpin,
    setSpinInProgress,
    syncGemBalanceFromServer,
    markVaultItemPendingShipment,
  } = useApp();
  const { session } = useAuth();
  const storeCommerce = isAppStoreCommerce();
  const isGuest = !userId;

  const [phase, setPhase] = useState<OpenPhase>("pre-rip");
  const [isChargingSpin, setIsChargingSpin] = useState(false);
  const [pullQueue, setPullQueue] = useState<PackPullEntry[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [pullVaultIds, setPullVaultIds] = useState<string[]>([]);
  const [fairnessSession, setFairnessSession] = useState<FairnessSession | null>(null);
  const [transactionFailureOpen, setTransactionFailureOpen] = useState(false);
  const [whatsInsideOpen, setWhatsInsideOpen] = useState(false);
  const [revealStoreRarity, setRevealStoreRarity] = useState<StoreRarity>("Common");
  const [carouselCards, setCarouselCards] = useState<Card[]>([]);
  const [isCarouselSpinning, setIsCarouselSpinning] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [completeInfoOpen, setCompleteInfoOpen] = useState(false);

  const spinLandTimerRef = useRef<number | null>(null);
  const spinnerHapticIntervalRef = useRef<number | null>(null);

  const quantity = 1;
  const activeVaultItemId = pullVaultIds[queueIndex] ?? null;
  const activePullCard = useMemo(() => {
    if (!selectedPack) return null;
    const entry = pullQueue[queueIndex];
    if (!entry) return null;
    return resolveCardByItemId(selectedPack.id, entry.itemId);
  }, [selectedPack, pullQueue, queueIndex]);

  const dropTable = useMemo(
    () => (selectedPack ? getPackDropTable(selectedPack.id) : []),
    [selectedPack?.id],
  );

  const activeDropEntry = useMemo(() => {
    if (!activePullCard) return undefined;
    return dropTable.find((entry) => entry.card.id === activePullCard.id);
  }, [activePullCard, dropTable]);

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

  const landCarouselSpin = useCallback(() => {
    clearCarouselSpin();
    setIsCarouselSpinning(false);
    void hapticHeavyImpact();
    if (import.meta.env.DEV) {
      console.log("[SpinnerHaptic] land");
    }
    completeReveal();
  }, [clearCarouselSpin, completeReveal]);

  const startCarouselSpin = useCallback(() => {
    clearCarouselSpin();
    setSpinKey((key) => key + 1);
    setIsCarouselSpinning(true);
    void hapticSpinnerTick();
    spinnerHapticIntervalRef.current = window.setInterval(() => {
      void hapticSpinnerTick();
    }, SPINNER_HAPTIC_INTERVAL_MS);
    spinLandTimerRef.current = window.setTimeout(() => {
      landCarouselSpin();
    }, MOBILE_SPIN_DURATION_MS + MOBILE_SPIN_LAND_BUFFER_MS);
  }, [clearCarouselSpin, landCarouselSpin]);

  const handleDismiss = useCallback(() => {
    clearCarouselSpin();
    setIsCarouselSpinning(false);
    setSpinInProgress(false);
    setShippingModalOpen(false);
    stackPop();
  }, [clearCarouselSpin, setShippingModalOpen, setSpinInProgress, stackPop]);

  const handleSkipSpinner = useCallback(() => {
    void hapticTabSelect();
    clearCarouselSpin();
    setIsCarouselSpinning(false);
    void hapticHeavyImpact();
    completeReveal();
  }, [clearCarouselSpin, completeReveal]);

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
    setSpinKey(0);
    void buildPendingFairnessSession(selectedPack.id).then(setFairnessSession);
  }, [clearCarouselSpin, selectedPack?.id]);

  const executeRip = useCallback(async (): Promise<RipResult> => {
    if (!selectedPack) return { ok: false };

    const totalCost = selectedPack.cost * quantity;

    if (storeCommerce && !isGuest && userId) {
      const accessToken = session?.access_token;
      if (!accessToken) {
        showErrorToast("Please sign in again to complete your purchase.");
        return { ok: false };
      }
      const purchase = await purchasePackForOpening(
        selectedPack.id,
        selectedPack.cost,
        quantity,
        accessToken,
      );
      if (!purchase.ok) {
        return { ok: false, cancelled: purchase.cancelled };
      }
      try {
        await syncGemBalanceFromServer(userId);
      } catch (syncError) {
        console.error("[OpenPack] syncGemBalanceFromServer threw", syncError);
        throw syncError;
      }
    }

    if (!isGuest && !storeCommerce && goldVolts < totalCost) {
      showCashoutToast(`Insufficient ${RETAIL_COPY.currency} for this opening.`);
      return { ok: false };
    }

    try {
      const rollResults = rollMultipleWithRoll(quantity, selectedPack.id);
      const pullEntries: PackPullEntry[] = rollResults.map((result) => ({
        itemId: result.card.id,
        rolledNumber: result.rolledNumber,
      }));

      const vaultIds: string[] = [];

      if (!isGuest && userId) {
        setSpinInProgress(true);
        for (let index = 0; index < pullEntries.length; index += 1) {
          const cardData = resolveCardByItemId(selectedPack.id, pullEntries[index]!.itemId);
          const spinResult = await handleSpin(selectedPack.cost, {
            itemId: cardData.id,
            itemName: cardData.name,
            gemValue: cardData.value,
            imageUrl: cardData.image,
          });
          if (!spinResult.ok) {
            setSpinInProgress(false);
            showErrorToast(spinResult.error);
            setTransactionFailureOpen(true);
            return { ok: false };
          }
          setGoldVolts(spinResult.gemsBalance);
          if (spinResult.vaultItemId) {
            appendVaultPullFromSpin({
              vaultId: spinResult.vaultItemId,
              id: cardData.id,
              name: cardData.name,
              rarity: cardData.rarity,
              value: cardData.value,
              image: cardData.image,
              acquiredAt: new Date().toISOString(),
              status: "vaulted",
            });
            vaultIds.push(spinResult.vaultItemId);
          }
        }
      }

      void commitFairnessSession(
        selectedPack.id,
        rollResults[0]!.rolledNumber,
        fairnessSession,
      ).then(setFairnessSession);

      const historyUserId = userId;
      if (historyUserId) {
        for (const entry of pullEntries) {
          const cardData = resolveCardByItemId(selectedPack.id, entry.itemId);
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
    session,
    storeCommerce,
    goldVolts,
    fairnessSession,
    quantity,
    showErrorToast,
    showCashoutToast,
    setGoldVolts,
    appendVaultPullFromSpin,
    setSpinInProgress,
    syncGemBalanceFromServer,
  ]);

  const beginSpinSequence = useCallback(
    (entries: PackPullEntry[], vaultIds: string[]) => {
      if (!selectedPack || entries.length === 0) return;

      const firstCard = resolveCardByItemId(selectedPack.id, entries[0]!.itemId);
      const { strip } = buildFullDropTableStrip(firstCard, selectedPack.id);

      setPullQueue(entries);
      setQueueIndex(0);
      setPullVaultIds(vaultIds);
      setRevealStoreRarity(resolveStoreRarityForCard(firstCard, dropTable));
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
  ]);

  const finishReveal = useCallback(() => {
    clearCarouselSpin();
    setIsCarouselSpinning(false);

    if (queueIndex < pullQueue.length - 1 && selectedPack) {
      const nextIndex = queueIndex + 1;
      const nextEntry = pullQueue[nextIndex]!;
      const nextCard = resolveCardByItemId(selectedPack.id, nextEntry.itemId);
      const { strip } = buildFullDropTableStrip(nextCard, selectedPack.id);

      setQueueIndex(nextIndex);
      setRevealStoreRarity(resolveStoreRarityForCard(nextCard, dropTable));
      setCarouselCards(strip);
      setPhase("spinning");
      startCarouselSpin();
      return;
    }

    setPullQueue([]);
    setQueueIndex(0);
    setPullVaultIds([]);
    setPhase("pre-rip");
    setShippingModalOpen(false);
    setSpinInProgress(false);
    stackPop();
  }, [
    clearCarouselSpin,
    pullQueue,
    queueIndex,
    selectedPack,
    setShippingModalOpen,
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
    setShippingModalOpen(true);
  }, [activeVaultItemId, setShippingModalOpen, showErrorToast]);

  if (!selectedPack) {
    return null;
  }

  const totalCost = selectedPack.cost * quantity;
  const canAfford = isGuest || storeCommerce || goldVolts >= totalCost;

  const openLabel = isChargingSpin
    ? "Processing…"
    : isGuest
      ? "Demo Open Pack"
      : storeCommerce
        ? `Open Pack · ${formatPackPriceUsd(totalCost)}`
        : "Open Pack";

  const showPack = phase === "pre-rip";
  const showSpinner = phase === "spinning";
  const showComplete = phase === "complete" && activePullCard;

  const bottomInset = { bottom: "max(1rem, env(safe-area-inset-bottom))" } as const;

  return (
    <>
      <motion.div
        className="rip-ambient-bg fixed inset-0 z-[100] flex flex-col overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={PAGE_STACK_SPRING}
      >
        {phase === "spinning" ? (
          <header
            className="relative z-50 flex shrink-0 items-center justify-between px-6 pb-3"
            style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.5rem)" }}
          >
            <p className="max-w-[55%] truncate text-[13px] font-medium uppercase tracking-wider text-[var(--rip-text-muted)]">
              {displayName(selectedPack.name)}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkipSpinner}
                className="text-[13px] font-medium tracking-wide text-[var(--rip-text-muted)] transition-opacity active:opacity-70"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--rip-surface)] text-lg leading-none text-white"
              >
                ×
              </button>
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

        {phase === "pre-rip" ? (
          <p
            className="pointer-events-none absolute inset-x-0 z-20 text-center text-[11px] font-medium tracking-[0.25em] uppercase text-[#A1A1AA]"
            style={{
              top: "calc(max(0.75rem, env(safe-area-inset-top)) + 3rem)",
              color: MOBILE_COLORS.textMuted,
            }}
          >
            {displayName(selectedPack.name)}
          </p>
        ) : null}

        <MobileErrorBoundary label="Pack opening failed">
          <div
            className={`relative z-10 flex min-h-0 flex-1 flex-col items-center p-0 ${
              showComplete ? "overflow-visible" : "overflow-hidden"
            } ${showComplete ? "" : "justify-center"}`}
          >
            <AnimatePresence mode="wait">
              {showPack ? (
                <motion.div
                  key="sealed-pack"
                  className="flex w-full flex-col items-center justify-center"
                  exit={{
                    opacity: 0,
                    scale: 0.5,
                    transition: { type: "spring", stiffness: 300, damping: 28 },
                  }}
                >
                  <GlassSurface
                    variant="default"
                    className="relative aspect-[3/4] w-[min(96vw,420px)] overflow-hidden rounded-2xl p-0"
                  >
                    <motion.div
                      className="relative h-full w-full"
                      animate={{ y: [0, -16, 0], rotate: [0, 0.8, 0, -0.8, 0] }}
                      transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <PackCatalogImage
                        packId={selectedPack.id}
                        src={selectedPack.image}
                        alt={selectedPack.name}
                        priority
                      />
                    </motion.div>
                  </GlassSurface>
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
                  <div className="mobile-spinner-wrapper relative w-full max-w-full">
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[8%] bg-gradient-to-r from-[var(--rip-bg-primary)] to-transparent"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 right-0 z-30 w-[8%] bg-gradient-to-l from-[var(--rip-bg-primary)] to-transparent"
                      aria-hidden
                    />
                    <UnboxingCarousel
                      cards={carouselCards}
                      isSpinning={isCarouselSpinning}
                      winnerIndex={ROULETTE_WINNER_INDEX}
                      spinDurationMs={MOBILE_SPIN_DURATION_MS}
                      cardWidth={MOBILE_SPIN_CARD_WIDTH}
                      compactCards
                      suppressEdgeFades
                    />
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
                    <TrophyCardHero card={activePullCard} />
                  </div>

                  <motion.div
                    className="mt-8 shrink-0 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={BUTTON_SPRING}
                  >
                    <p className="text-[24px] font-semibold text-white">{activePullCard.name}</p>
                    <p className="rip-glow-price-green mt-1 text-[32px] font-bold tabular-nums text-[var(--rip-green-bright)]">
                      {formatUsd(gemsToUsd(activePullCard.value))}
                    </p>
                    {activeDropEntry ? (
                      <p className="mt-1 text-[13px] text-[var(--rip-text-muted)]">
                        {formatProbability(activeDropEntry.probability)} chance
                      </p>
                    ) : null}
                  </motion.div>

                  <motion.div
                    className="mt-auto w-full shrink-0 pt-8"
                    style={bottomInset}
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
                      <div className="flex w-full gap-3">
                        <button
                          type="button"
                          onClick={handleSendToVault}
                          className={`${COMPLETE_ACTION_BTN} bg-[var(--rip-surface)] text-white`}
                        >
                          Vault
                        </button>
                        <button
                          type="button"
                          onClick={handleShip}
                          disabled={!activeVaultItemId}
                          className={`${COMPLETE_ACTION_BTN} bg-[var(--rip-surface)] text-white`}
                        >
                          Ship
                        </button>
                        <button
                          type="button"
                          onClick={finishReveal}
                          className={`${COMPLETE_ACTION_BTN} bg-[var(--rip-orange)] text-white active:bg-[var(--rip-orange-pressed)]`}
                        >
                          {pullQueue.length > 1 && queueIndex < pullQueue.length - 1
                            ? "Next Pull"
                            : "Done"}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </MobileErrorBoundary>

        <AnimatePresence mode="wait">
          {phase === "pre-rip" ? (
            <motion.div
              key="pre-rip-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={BUTTON_SPRING}
              className="fixed left-6 right-6 z-40 flex flex-col gap-3"
              style={bottomInset}
            >
              <button
                type="button"
                onClick={() => {
                  void hapticTabSelect();
                  setWhatsInsideOpen(true);
                }}
                className={BTN_GHOST_OUTLINE}
              >
                What&apos;s Inside
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => void handleOpenPack()}
                disabled={isChargingSpin || !canAfford}
                className={BTN_PRIMARY}
              >
                {openLabel}
              </motion.button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <MobileWhatsInsideDrawer
        packId={selectedPack.id}
        packName={selectedPack.name}
        open={whatsInsideOpen}
        onClose={() => setWhatsInsideOpen(false)}
      />

      {shippingModalOpen && activePullCard && activeVaultItemId ? (
        <VaultReleaseModal
          vaultItemId={activeVaultItemId}
          itemName={activePullCard.name}
          itemImage={activePullCard.image}
          itemValue={activePullCard.value}
          onClose={() => setShippingModalOpen(false)}
          onSuccessDismiss={finishReveal}
          successDismissLabel="Continue"
          onConfirm={createVaultReleaseOnConfirm({
            vaultItemId: activeVaultItemId,
            markVaultItemPendingShipment,
          })}
        />
      ) : null}

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
