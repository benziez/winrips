import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { recordPlayHistory } from "../../lib/playHistory";
import { handleSpin } from "../../lib/spinLogic";
import {
  exchangeVaultItemInUi,
  formatExchangeSuccessToast,
} from "../../lib/exchangeLogic";
import { rollMultipleWithRoll, resolveCardByItemId, type PackPullEntry } from "../../utils/rng";
import { formatPackPriceUsd, formatUsd, gemsToUsd, RETAIL_COPY } from "../../constants/retail";
import { isAppStoreCommerce } from "../../constants/commerce";
import { purchasePackForOpening } from "../../lib/nativePackPurchase";
import { PackCatalogImage } from "./PackCatalogImage";
import { FlippingSlabReveal } from "./FlippingSlabReveal";
import { PackTearOverlay } from "./PackTearOverlay";
import { MobileWhatsInsideDrawer } from "./MobileWhatsInsideDrawer";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import {
  buildPendingFairnessSession,
  commitFairnessSession,
  type FairnessSession,
} from "../../utils/provablyFair";
import { unlockSoundManager } from "../../lib/SoundManager";
import { TransactionFailureModal } from "../pack-opening/TransactionFailureModal";
import { VaultReleaseModal } from "../shipping/VaultReleaseModal";
import { createVaultReleaseOnConfirm } from "../../lib/vaultReleaseFlow";
import { isManualRipEnabled } from "../../lib/mobileRipPreferences";
import { formatProbability, getPackDropTable } from "../../data/packDropTables";
import { usePackAudio } from "../../hooks/usePackAudio";
import { useHapticRip } from "../../hooks/useHapticRip";
import { useManualRip } from "../../hooks/useManualRip";
import { useRipSequence, type RipSubPhase } from "../../hooks/useRipSequence";
import {
  BTN_GHOST_OUTLINE,
  BTN_PRIMARY,
  MOBILE_COLORS,
  OBSIDIAN_GOLD,
  PAGE_STACK_SPRING,
} from "./mobileTheme";
import { MobileErrorBoundary } from "./MobileErrorBoundary";
import { DismissPill } from "./DismissPill";
import { GlassSurface } from "./GlassSurface";

type RipPhase = "pre-rip" | "ripping" | "revealing" | "complete";

const BUTTON_SPRING = { type: "spring" as const, stiffness: 500, damping: 26 };

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
    applyVaultExchange,
    syncGemBalanceFromServer,
    markVaultItemPendingShipment,
  } = useApp();
  const { session } = useAuth();
  const storeCommerce = isAppStoreCommerce();
  const isGuest = !userId;

  const [phase, setPhase] = useState<RipPhase>("pre-rip");
  const [ripSubPhase, setRipSubPhase] = useState<RipSubPhase>("shake");
  const [tearProgress, setTearProgress] = useState(0);
  const [isChargingSpin, setIsChargingSpin] = useState(false);
  const [pullQueue, setPullQueue] = useState<PackPullEntry[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [pullVaultIds, setPullVaultIds] = useState<string[]>([]);
  const [isExchanging, setIsExchanging] = useState(false);
  const [fairnessSession, setFairnessSession] = useState<FairnessSession | null>(null);
  const [transactionFailureOpen, setTransactionFailureOpen] = useState(false);
  const [flipPlayKey, setFlipPlayKey] = useState(0);
  const [whatsInsideOpen, setWhatsInsideOpen] = useState(false);
  const [revealRarity, setRevealRarity] = useState<string | undefined>(undefined);
  const [manualRipMode, setManualRipMode] = useState(false);

  const quantity = 1;
  const activeVaultItemId = pullVaultIds[queueIndex] ?? null;
  const haptics = useHapticRip();
  const packAudio = usePackAudio();
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
    haptics.stop();
    packAudio.stopAll();
    if (window.history.length > 1) {
      navigate(-1);
    }
    goToLobby();
  }, [goToLobby, haptics, navigate, packAudio]);

  const handleDismiss = useCallback(() => {
    setSpinInProgress(false);
    setShippingModalOpen(false);
    stackPop();
  }, [setShippingModalOpen, setSpinInProgress, stackPop]);

  const enterReveal = useCallback(() => {
    haptics.stop();
    packAudio.stopTensionAndBurst();
    const card = activePullCard;
    if (card) {
      setRevealRarity(card.rarity);
    }
    setFlipPlayKey((key) => key + 1);
    setPhase("revealing");
  }, [activePullCard, haptics, packAudio]);

  const { start: startAutoRip, cancel: cancelAutoRip } = useRipSequence({
    onSubPhase: setRipSubPhase,
    onTensionStart: () => {
      void packAudio.startTensionFade();
    },
    onRevealTransition: () => {
      setTearProgress(1);
    },
    onComplete: enterReveal,
  });

  const hapticsRef = useRef(haptics);
  const packAudioRef = useRef(packAudio);
  const cancelAutoRipRef = useRef(cancelAutoRip);
  hapticsRef.current = haptics;
  packAudioRef.current = packAudio;
  cancelAutoRipRef.current = cancelAutoRip;

  const handleManualBurst = useCallback(() => {
    if (phase !== "ripping") return;
    haptics.burst();
    packAudio.stopTensionAndBurst();
    setRipSubPhase("transition");
    setTearProgress(1);
    window.setTimeout(() => enterReveal(), 450);
  }, [enterReveal, haptics, packAudio, phase]);

  const manualRip = useManualRip({
    onBurst: handleManualBurst,
    onProgress: (progress) => {
      setTearProgress(progress);
      setRipSubPhase(progress > 0.12 ? "tear" : "shake");
      haptics.pulseForDrag(progress);
      if (progress > 0.25 && progress < 0.85) {
        void packAudio.startTensionFade();
      }
    },
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    setManualRipMode(isManualRipEnabled());
    packAudioRef.current.preload();
    return () => {
      document.body.style.overflow = "";
      cancelAutoRipRef.current();
      hapticsRef.current.stop();
      packAudioRef.current.stopAll();
    };
  }, []);

  useEffect(() => {
    if (!selectedPack) return;
    setPhase("pre-rip");
    setRipSubPhase("shake");
    setTearProgress(0);
    setPullQueue([]);
    setQueueIndex(0);
    setPullVaultIds([]);
    setIsExchanging(false);
    setTransactionFailureOpen(false);
    setFlipPlayKey(0);
    setWhatsInsideOpen(false);
    setRevealRarity(undefined);
    manualRip.reset();
    void buildPendingFairnessSession(selectedPack.id).then(setFairnessSession);
  }, [selectedPack?.id]);

  useEffect(() => {
    if (ripSubPhase === "tear" && phase === "ripping" && !manualRipMode) {
      haptics.stop();
    }
  }, [haptics, manualRipMode, phase, ripSubPhase]);

  useEffect(() => {
    if (phase !== "ripping" || manualRipMode || ripSubPhase !== "tear") return;

    const durationMs = 4_000;
    const startedAt = performance.now();
    let frame = 0;

    const tick = () => {
      const t = Math.min(1, (performance.now() - startedAt) / durationMs);
      setTearProgress(0.22 + t * 0.72);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [manualRipMode, phase, ripSubPhase]);

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
      await syncGemBalanceFromServer(userId);
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
    } catch {
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

  const beginRipSequence = useCallback(
    (entries: PackPullEntry[], vaultIds: string[]) => {
      setPullQueue(entries);
      setQueueIndex(0);
      setPullVaultIds(vaultIds);
      const firstCard = resolveCardByItemId(selectedPack!.id, entries[0]!.itemId);
      setRevealRarity(firstCard.rarity);
      setPhase("ripping");
      setRipSubPhase("shake");
      setTearProgress(0);
      manualRip.reset();

      if (manualRipMode) {
        return;
      }

      haptics.startShakePulses();
      startAutoRip();
    },
    [haptics, manualRip, manualRipMode, selectedPack, startAutoRip],
  );

  const handleOpenPack = useCallback(async () => {
    if (!selectedPack || phase !== "pre-rip" || isChargingSpin) return;

    void hapticTabSelect();
    unlockSoundManager();
    packAudio.preload();
    setIsChargingSpin(true);

    try {
      const result = await executeRip();

      if (!result.ok) {
        setSpinInProgress(false);
        return;
      }

      beginRipSequence(result.entries, result.vaultIds);
    } finally {
      setIsChargingSpin(false);
    }
  }, [
    selectedPack,
    phase,
    isChargingSpin,
    executeRip,
    beginRipSequence,
    packAudio,
    setSpinInProgress,
  ]);

  const finishReveal = useCallback(() => {
    if (queueIndex < pullQueue.length - 1 && selectedPack) {
      setQueueIndex(queueIndex + 1);
      setFlipPlayKey((key) => key + 1);
      const next = resolveCardByItemId(selectedPack.id, pullQueue[queueIndex + 1]!.itemId);
      setRevealRarity(next.rarity);
      setPhase("revealing");
      return;
    }

    setPullQueue([]);
    setQueueIndex(0);
    setPullVaultIds([]);
    setPhase("pre-rip");
    setShippingModalOpen(false);
    setSpinInProgress(false);
    packAudio.stopAll();
    stackPop();
  }, [
    pullQueue,
    queueIndex,
    selectedPack,
    setShippingModalOpen,
    setSpinInProgress,
    packAudio,
    stackPop,
  ]);

  const handleBurn = useCallback(async () => {
    if (!activePullCard || isGuest || isExchanging) return;
    const vaultItemId = pullVaultIds[queueIndex];
    if (!vaultItemId) {
      showCashoutToast("Unable to exchange this pull.");
      return;
    }
    setIsExchanging(true);
    try {
      await exchangeVaultItemInUi(vaultItemId, {
        removeVaultItem: (id, gemsAdded, serverGemsBalance) => {
          applyVaultExchange(id, gemsAdded, serverGemsBalance);
        },
        syncGemBalance: userId ? () => syncGemBalanceFromServer(userId) : undefined,
        closeModal: finishReveal,
        toastError: showErrorToast,
        toastSuccess: (gemsAdded) => {
          showCashoutToast(formatExchangeSuccessToast(gemsAdded));
        },
      });
    } finally {
      setIsExchanging(false);
    }
  }, [
    activePullCard,
    isGuest,
    isExchanging,
    pullVaultIds,
    queueIndex,
    finishReveal,
    showCashoutToast,
    showErrorToast,
    applyVaultExchange,
    syncGemBalanceFromServer,
    userId,
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

  const showPack = phase === "pre-rip" || phase === "ripping";
  const showCard = (phase === "revealing" || phase === "complete") && activePullCard;
  const isRevealScreen = phase === "revealing" || phase === "complete";
  const showTear =
    phase === "ripping" && (ripSubPhase === "tear" || ripSubPhase === "transition" || manualRipMode);
  const tearAmount =
    manualRipMode && phase === "ripping"
      ? manualRip.progress
      : ripSubPhase === "transition"
        ? 1
        : ripSubPhase === "tear"
          ? Math.max(tearProgress, 0.35)
          : 0;

  const bottomInset = { bottom: "max(1rem, env(safe-area-inset-bottom))" } as const;

  const packShakeAnimate =
    phase === "ripping" && ripSubPhase === "shake"
      ? {
          x: [-8, 10, -10, 12, -8, 8],
          y: [6, -8, 10, -10, 6, -6],
          rotate: [-3, 4, -4, 5, -3, 3],
        }
      : phase === "ripping" && ripSubPhase === "tear"
        ? {
            x: [-14, 16, -16, 18, -12, 14],
            y: [10, -12, 14, -14, 10, -10],
            rotate: [-5, 6, -6, 7, -5, 5],
          }
        : phase === "pre-rip"
          ? { y: [0, -16, 0], rotate: [0, 0.8, 0, -0.8, 0] }
          : undefined;

  const packShakeTransition =
    phase === "ripping"
      ? { duration: 0.1, repeat: Infinity, ease: "linear" as const }
      : phase === "pre-rip"
        ? { duration: 4.2, repeat: Infinity, ease: "easeInOut" as const }
        : undefined;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-black"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={PAGE_STACK_SPRING}
      >
        {phase === "ripping" && ripSubPhase === "transition" ? (
          <div className="mobile-lens-flare pointer-events-none absolute inset-0 z-0" aria-hidden />
        ) : null}

        <DismissPill
          onClick={handleDismiss}
          className="absolute right-6 z-50"
          style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
        />

        {!isRevealScreen ? (
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
            className={`relative z-10 flex min-h-0 flex-1 flex-col items-center overflow-hidden p-0 ${
              phase === "complete" ? "" : "justify-center"
            }`}
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
                    className="relative aspect-[3/4] w-[min(96vw,420px)] touch-none overflow-hidden rounded-2xl p-0"
                    {...(manualRipMode && phase === "ripping" ? manualRip.handlers : {})}
                  >
                    <motion.div
                      className="relative h-full w-full"
                      animate={packShakeAnimate}
                      transition={packShakeTransition}
                    >
                      <PackCatalogImage
                        packId={selectedPack.id}
                        src={selectedPack.image}
                        alt={selectedPack.name}
                        priority
                      />
                      {showTear ? <PackTearOverlay progress={tearAmount} /> : null}
                    </motion.div>
                  </GlassSurface>
                  {manualRipMode && phase === "ripping" ? (
                    <p
                      className="mt-6 text-center text-xs font-bold tracking-[0.3em] uppercase"
                      style={{ color: MOBILE_COLORS.textMuted }}
                    >
                      Pull down to rip
                    </p>
                  ) : null}
                </motion.div>
              ) : null}

              {showCard ? (
                <motion.div
                  key={`card-${flipPlayKey}`}
                  className={
                    phase === "complete"
                      ? "flex min-h-0 w-full flex-1 flex-col items-center gap-4 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
                      : "flex h-full w-full flex-col items-center justify-center overflow-hidden"
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <div
                    className={
                      phase === "complete"
                        ? "relative flex min-h-0 w-full flex-1 items-center justify-center"
                        : "relative flex h-full w-full flex-1 items-center justify-center overflow-hidden"
                    }
                  >
                    {phase === "complete" ? (
                      <div className="reveal-card-frame relative mx-auto h-[min(62dvh,520px)] w-[min(88vw,360px)] shrink-0">
                        <div className="h-full w-full [&>div]:h-full [&>div]:w-full [&>div>div:nth-child(2)]:!h-full [&>div>div:nth-child(2)]:!max-h-full [&>div>div:nth-child(2)]:!w-full">
                          <FlippingSlabReveal
                            card={activePullCard}
                            revealRarity={revealRarity}
                            playFlip={false}
                            immersive={false}
                          />
                        </div>
                      </div>
                    ) : (
                      <FlippingSlabReveal
                        card={activePullCard}
                        revealRarity={revealRarity}
                        playFlip
                        immersive
                        onFlipComplete={() => {
                          setPhase("complete");
                          setSpinInProgress(false);
                        }}
                      />
                    )}
                  </div>

                  {phase === "complete" ? (
                    <>
                      <motion.div
                        className="flex w-full shrink-0 flex-col items-center gap-2 px-2 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={BUTTON_SPRING}
                      >
                        <p className="text-xl font-semibold text-white">{activePullCard.name}</p>
                        <p
                          className="text-lg font-semibold tabular-nums tracking-tight"
                          style={{ color: OBSIDIAN_GOLD.bright }}
                        >
                          {formatUsd(gemsToUsd(activePullCard.value))}
                        </p>
                        {activeDropEntry ? (
                          <p className="text-sm" style={{ color: MOBILE_COLORS.textMuted }}>
                            {formatProbability(activeDropEntry.probability)} chance
                          </p>
                        ) : null}
                      </motion.div>

                      <motion.div
                        className="flex w-full shrink-0 flex-col gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={BUTTON_SPRING}
                      >
                        {!isGuest ? (
                          <GlassSurface
                            variant="default"
                            className="flex justify-center gap-2 rounded-2xl px-2 py-2"
                          >
                            {(
                              [
                                ...(storeCommerce
                                  ? []
                                  : ([
                                      [
                                        "Exchange",
                                        () => void handleBurn(),
                                        isExchanging || !activeVaultItemId,
                                      ],
                                    ] as const)),
                                ["Vault", handleSendToVault, isExchanging],
                                ["Ship", handleShip, isExchanging || !activeVaultItemId],
                              ] as const
                            ).map(([label, onClick, disabled]) => (
                              <button
                                key={label}
                                type="button"
                                onClick={onClick}
                                disabled={disabled}
                                className={`${BTN_GHOST_OUTLINE} !py-2 !text-xs disabled:opacity-30`}
                              >
                                {label}
                              </button>
                            ))}
                          </GlassSurface>
                        ) : null}
                        <button
                          type="button"
                          onClick={finishReveal}
                          disabled={isExchanging}
                          className={BTN_PRIMARY}
                        >
                          {pullQueue.length > 1 && queueIndex < pullQueue.length - 1
                            ? "Next Pull"
                            : "Done"}
                        </button>
                      </motion.div>
                    </>
                  ) : null}
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

          {phase === "ripping" && !manualRipMode ? (
            <motion.p
              key="ripping-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-x-0 z-40 text-center text-xs font-bold tracking-[0.35em] uppercase"
              style={{ ...bottomInset, color: OBSIDIAN_GOLD.bright }}
            >
              {ripSubPhase === "shake"
                ? "Ripping…"
                : ripSubPhase === "tear"
                  ? "Tearing…"
                  : "Revealing…"}
            </motion.p>
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
    </>
  );
}
