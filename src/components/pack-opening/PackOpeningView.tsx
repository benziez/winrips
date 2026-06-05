import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "../../types";
import { useApp } from "../../context/AppContext";
import { recordPlayHistory } from "../../lib/playHistory";
import { openPack } from "../../lib/spinLogic";
import {
  exchangeVaultItemInUi,
  formatExchangeSuccessToast,
} from "../../lib/exchangeLogic";
import {
  rollMultipleWithRoll,
  buildCarouselStrip,
  buildPreviewCarouselStrip,
  cardFromPullEntry,
  resolveCardByItemId,
  type PackPullEntry,
  ROULETTE_WINNER_INDEX,
  ROULETTE_SPIN_MS,
} from "../../utils/rng";
import { QuantitySelector, type OpenQuantity } from "./QuantitySelector";
import { UnboxingCarousel } from "./UnboxingCarousel";
import { RevealModal } from "./RevealModal";
import { VaultReleaseModal } from "../shipping/VaultReleaseModal";
import { createVaultReleaseOnConfirm } from "../../lib/vaultReleaseFlow";
import { DropTableMatrix } from "./DropTableMatrix";
import { formatGems, formatPackPriceUsd, RETAIL_COPY } from "../../constants/retail";
import { useIsNarrowViewport } from "../../hooks/useIsNarrowViewport";
import { MobilePackOpeningView } from "../mobile/MobilePackOpeningView";
import { isNativeCapacitorApp } from "../../utils/platform";
import { FairnessVerifiedBadge } from "./FairnessVerifiedBadge";
import { FairnessVerifyModal } from "./FairnessVerifyModal";
import {
  buildPendingFairnessSession,
  commitFairnessSession,
  type FairnessSession,
} from "../../utils/provablyFair";
import { CardDetailModalProvider } from "../../context/CardDetailModalContext";
import { SoundManager } from "../../lib/SoundManager";

const SPIN_DURATION_MS = ROULETTE_SPIN_MS;
const MOBILE_PREVIEW_LENGTH = 3;
const MOBILE_PREVIEW_WINNER_INDEX = 1;
const MOBILE_CARD_WIDTH = 96;

function cardFromServerWinner(packId: string, winner: {
  itemId: string;
  itemName: string;
  gemValue: number;
  imageUrl: string;
  storeRarity: string;
}): Card {
  return cardFromPullEntry(packId, {
    itemId: winner.itemId,
    rolledNumber: 0,
    serverItemName: winner.itemName,
    serverImageUrl: winner.imageUrl,
    serverGemValue: winner.gemValue,
    serverStoreRarity: winner.storeRarity,
  });
}

export function PackOpeningView() {
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
    navigateToView,
    appendVaultPullFromSpin,
    setSpinInProgress,
    applyVaultExchange,
    syncGemBalanceFromServer,
    markVaultItemPendingShipment,
    openWalletModal,
  } = useApp();

  const isGuest = !userId;

  const isNarrow = useIsNarrowViewport();
  const isNarrowRef = useRef(isNarrow);
  isNarrowRef.current = isNarrow;

  const [quantity, setQuantity] = useState<OpenQuantity>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isChargingSpin, setIsChargingSpin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [carouselCards, setCarouselCards] = useState<Card[]>([]);
  const [spinKey, setSpinKey] = useState(0);
  const [pullQueue, setPullQueue] = useState<PackPullEntry[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [pullVaultIds, setPullVaultIds] = useState<string[]>([]);
  const [isExchanging, setIsExchanging] = useState(false);
  const [fairnessSession, setFairnessSession] = useState<FairnessSession | null>(null);
  const [fairnessModalOpen, setFairnessModalOpen] = useState(false);
  const activeVaultItemId = pullVaultIds[queueIndex] ?? null;

  const activePullCard = useMemo(() => {
    if (!selectedPack) return null;
    const entry = pullQueue[queueIndex];
    if (!entry) return null;
    return cardFromPullEntry(selectedPack.id, entry);
  }, [selectedPack, pullQueue, queueIndex]);

  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinRafRef = useRef<number | null>(null);

  const buildIdlePreviewStrip = useCallback((packId: string) => {
    return isNarrowRef.current
      ? buildPreviewCarouselStrip(
          packId,
          MOBILE_PREVIEW_LENGTH,
          MOBILE_PREVIEW_WINNER_INDEX,
        )
      : buildPreviewCarouselStrip(packId);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const clearSpinSpeedLoop = useCallback(() => {
    if (spinRafRef.current != null) {
      cancelAnimationFrame(spinRafRef.current);
      spinRafRef.current = null;
    }
  }, []);

  const clearSpinTimer = useCallback(() => {
    if (spinTimerRef.current) {
      clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }
    clearSpinSpeedLoop();
  }, [clearSpinSpeedLoop]);

  const startSpinSpeedLoop = useCallback(() => {
    clearSpinSpeedLoop();
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / SPIN_DURATION_MS);
      SoundManager.updateSpinSpeed(progress);
      if (progress < 1) {
        spinRafRef.current = requestAnimationFrame(tick);
      }
    };

    SoundManager.updateSpinSpeed(0);
    spinRafRef.current = requestAnimationFrame(tick);
  }, [clearSpinSpeedLoop]);

  const beginCarouselSpin = useCallback(() => {
    clearSpinTimer();
    SoundManager.playSpin();
    startSpinSpeedLoop();
    spinTimerRef.current = setTimeout(() => {
      clearSpinSpeedLoop();
      SoundManager.updateSpinSpeed(1);
      setIsSpinning(false);
      setShowModal(true);
      spinTimerRef.current = null;
      SoundManager.stopSpinAndPlayReveal();
    }, SPIN_DURATION_MS);
  }, [clearSpinTimer, clearSpinSpeedLoop, startSpinSpeedLoop]);

  useEffect(() => () => {
    clearSpinTimer();
    SoundManager.stopAll();
  }, [clearSpinTimer]);

  useEffect(() => {
    if (!selectedPack) {
      setCarouselCards([]);
      return;
    }

    setCarouselCards(buildIdlePreviewStrip(selectedPack.id));
    setSpinKey((k) => k + 1);
    setIsSpinning(false);
    setShowModal(false);
    setPullQueue([]);
    setQueueIndex(0);
    setPullVaultIds([]);
    setIsExchanging(false);
    setFairnessModalOpen(false);
    void buildPendingFairnessSession(selectedPack.id).then(setFairnessSession);
  }, [selectedPack?.id, buildIdlePreviewStrip]);

  useEffect(() => {
    if (!selectedPack || isSpinning || showModal) return;
    setCarouselCards(buildIdlePreviewStrip(selectedPack.id));
    setSpinKey((k) => k + 1);
  }, [isNarrow, isSpinning, showModal, buildIdlePreviewStrip, selectedPack?.id]);

  const handleOpenPack = useCallback(async () => {
    if (isSpinning || isChargingSpin || !selectedPack) return;

    SoundManager.unlock();

    const totalCost = selectedPack.cost * quantity;

    if (!isGuest && goldVolts < totalCost) {
      showErrorToast("Add funds to open this pack.");
      openWalletModal("overview");
      return;
    }

    if (!isGuest && userId) {
      setIsChargingSpin(true);
      setSpinInProgress(true);
      const vaultIds: string[] = [];
      try {
        const openResult = await openPack(
          selectedPack.id,
          selectedPack.cost,
          quantity,
          userId,
        );
        if (!openResult.ok) {
          showErrorToast(openResult.error);
          setSpinInProgress(false);
          goToLobby();
          return;
        }

        setGoldVolts(openResult.gemsBalance);

        const pullEntries: PackPullEntry[] = openResult.winners.map((winner) => ({
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

        setPullVaultIds(vaultIds);

        void commitFairnessSession(selectedPack.id, 0, fairnessSession).then(setFairnessSession);

        if (userId) {
          for (const entry of pullEntries) {
            const cardData = cardFromPullEntry(selectedPack.id, entry);
            void recordPlayHistory({
              userId,
              packName: selectedPack.name,
              spinCost: selectedPack.cost,
              wonItemName: cardData.name,
              wonItemValue: cardData.value,
              wonItemImage: cardData.image,
              rolledNumber: entry.rolledNumber,
            }).then(() => {
              window.dispatchEvent(new Event("winrips:play-history-updated"));
            });
          }
        }

        const firstCard = cardFromPullEntry(selectedPack.id, pullEntries[0]!);
        const { strip } = buildCarouselStrip(firstCard, selectedPack.id);

        setPullQueue(pullEntries);
        setQueueIndex(0);
        setCarouselCards(strip);
        setShowModal(false);
        setSpinKey((k) => k + 1);
        setIsSpinning(true);
        beginCarouselSpin();
        void syncGemBalanceFromServer(userId);
      } catch {
        setSpinInProgress(false);
        showErrorToast("Could not open pack.");
        goToLobby();
      } finally {
        setIsChargingSpin(false);
      }
      return;
    }

    clearSpinTimer();

    const rollResults = rollMultipleWithRoll(quantity, selectedPack.id);
    void commitFairnessSession(selectedPack.id, rollResults[0]!.rolledNumber, fairnessSession).then(
      setFairnessSession,
    );

    const pullEntries: PackPullEntry[] = rollResults.map((result) => ({
      itemId: result.card.id,
      rolledNumber: result.rolledNumber,
    }));

    if (userId) {
      for (const entry of pullEntries) {
        const cardData = resolveCardByItemId(selectedPack.id, entry.itemId);
        void recordPlayHistory({
          userId,
          packName: selectedPack.name,
          spinCost: selectedPack.cost,
          wonItemName: cardData.name,
          wonItemValue: cardData.value,
          wonItemImage: cardData.image,
          rolledNumber: entry.rolledNumber,
        }).then(() => {
          window.dispatchEvent(new Event("winrips:play-history-updated"));
        });
      }
    }

    const firstCard = resolveCardByItemId(selectedPack.id, pullEntries[0]!.itemId);
    const { strip } = buildCarouselStrip(firstCard, selectedPack.id);

    setPullQueue(pullEntries);
    setQueueIndex(0);
    setCarouselCards(strip);
    setShowModal(false);
    setSpinKey((k) => k + 1);
    setIsSpinning(true);
    beginCarouselSpin();
  }, [
    isSpinning,
    isChargingSpin,
    selectedPack,
    quantity,
    isGuest,
    goldVolts,
    setGoldVolts,
    clearSpinTimer,
    beginCarouselSpin,
    showCashoutToast,
    userId,
    appendVaultPullFromSpin,
    setSpinInProgress,
    fairnessSession,
    syncGemBalanceFromServer,
    openWalletModal,
    showErrorToast,
    goToLobby,
  ]);

  const finishReveal = useCallback(() => {
    setShowModal(false);
    clearSpinTimer();

    if (queueIndex < pullQueue.length - 1 && selectedPack) {
      const nextIndex = queueIndex + 1;
      const nextEntry = pullQueue[nextIndex]!;
      const nextCard = resolveCardByItemId(selectedPack.id, nextEntry.itemId);
      const { strip } = buildCarouselStrip(nextCard, selectedPack.id);

      setQueueIndex(nextIndex);
      setCarouselCards(strip);
      setSpinKey((k) => k + 1);
      setIsSpinning(true);
      setShippingModalOpen(false);
      beginCarouselSpin();
    } else {
      setPullQueue([]);
      setQueueIndex(0);
      setPullVaultIds([]);
      setIsSpinning(false);
      setShippingModalOpen(false);
      setSpinInProgress(false);
      if (selectedPack) {
        setCarouselCards(buildIdlePreviewStrip(selectedPack.id));
        setSpinKey((k) => k + 1);
      } else {
        setCarouselCards([]);
      }
    }
  }, [pullQueue, queueIndex, clearSpinTimer, setShippingModalOpen, selectedPack, buildIdlePreviewStrip, setSpinInProgress, beginCarouselSpin]);

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
        removeVaultItem: (id, gemsAdded, serverGemsBalance, serverWithdrawableBalance) => {
          applyVaultExchange(id, gemsAdded, serverGemsBalance, serverWithdrawableBalance);
        },
        syncGemBalance: userId
          ? () => syncGemBalanceFromServer(userId)
          : undefined,
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
    showCashoutToast,
    showErrorToast,
    applyVaultExchange,
    syncGemBalanceFromServer,
    finishReveal,
    userId,
  ]);

  const handleSendToVault = useCallback(() => {
    if (!activePullCard || isGuest || isExchanging) return;
    showCashoutToast(`${activePullCard.name} secured in your vault locker.`);
    finishReveal();
  }, [activePullCard, isGuest, isExchanging, showCashoutToast, finishReveal]);

  const handleShip = useCallback(() => {
    if (!activeVaultItemId) {
      showErrorToast("This pull is still being secured in your vault. Try again in a moment.");
      return;
    }
    setShippingModalOpen(true);
  }, [activeVaultItemId, setShippingModalOpen, showErrorToast]);

  if (!selectedPack) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted">
        No pack selected.{" "}
        <button type="button" className="text-fuchsia hover:underline" onClick={goToLobby}>
          Return to lobby
        </button>
      </div>
    );
  }

  if (isNativeCapacitorApp()) {
    return <MobilePackOpeningView />;
  }

  const totalCost = selectedPack.cost * quantity;
  const openButtonLabel = isChargingSpin
    ? "Processing…"
    : isSpinning
      ? "Ripping Pack..."
      : isGuest
        ? quantity === 1
          ? "Demo Spin"
          : `Demo Spin × ${quantity}`
        : quantity === 1
          ? `${RETAIL_COPY.purchaseVerb} · ${formatPackPriceUsd(selectedPack.cost)}`
          : `${RETAIL_COPY.purchaseVerb} × ${quantity} · ${formatPackPriceUsd(totalCost)}`;
  const isPreviewStrip = !isSpinning && carouselCards.length <= MOBILE_PREVIEW_LENGTH;
  const carouselWinnerIndex = isPreviewStrip ? MOBILE_PREVIEW_WINNER_INDEX : ROULETTE_WINNER_INDEX;
  const carouselCardWidth = isNarrow && isPreviewStrip ? MOBILE_CARD_WIDTH : undefined;
  const canExchangeReveal = !isGuest && Boolean(activeVaultItemId);
  const canShipReveal = canExchangeReveal;

  return (
    <CardDetailModalProvider>
    <section className="mx-auto w-full max-w-[1600px] overflow-x-hidden px-2 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={goToLobby}
            className="mb-2 flex items-center gap-1 text-xs font-light text-muted hover:text-fuchsia"
          >
            ← Back
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {selectedPack.name}
            </h1>
            {fairnessSession ? (
              <FairnessVerifiedBadge onClick={() => setFairnessModalOpen(true)} />
            ) : null}
          </div>
          <p className="mt-1 text-sm font-light text-muted">
            {`${formatGems(selectedPack.cost)} × ${quantity} = ${formatGems(totalCost)}`}
          </p>
        </div>
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          disabled={isSpinning || isChargingSpin || showModal}
        />
      </div>

      <div className="w-full max-w-full overflow-hidden">
        <div className="spin-reel-frame flex flex-col overflow-hidden">
          <UnboxingCarousel
            key={spinKey}
            cards={carouselCards}
            isSpinning={isSpinning}
            winnerIndex={carouselWinnerIndex}
            cardWidth={carouselCardWidth}
          />

          <div className="flex flex-col items-center gap-1 border-t border-border/60 bg-slate-elevated/40 px-4 py-3 sm:py-3.5">
            <button
              type="button"
              onClick={() => void handleOpenPack()}
              disabled={isSpinning || isChargingSpin || showModal}
              className="w-full max-w-sm rounded-xl bg-[#FF007F] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
            >
              {openButtonLabel}
            </button>
            {isGuest && !isSpinning && !showModal ? (
              <p className="text-xs text-muted">Free preview — same odds as live opens</p>
            ) : null}
            {!isGuest && goldVolts < totalCost && !isSpinning && !showModal && !isChargingSpin ? (
              <p className="text-xs text-fuchsia">Add funds to open this pack</p>
            ) : null}
          </div>
        </div>

        <DropTableMatrix packId={selectedPack.id} packName={selectedPack.name} />
      </div>

      {showModal && activePullCard && !shippingModalOpen && (
        <RevealModal
          key={`${activePullCard.id}-${queueIndex}`}
          card={activePullCard}
          isGuest={isGuest}
          isExchanging={isExchanging}
          canExchange={canExchangeReveal}
          canShip={canShipReveal}
          onBurn={() => void handleBurn()}
          onSendToVault={handleSendToVault}
          onShip={handleShip}
          onClose={finishReveal}
        />
      )}

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

      {fairnessModalOpen && fairnessSession ? (
        <FairnessVerifyModal
          session={fairnessSession}
          packLabel={selectedPack.name}
          onClose={() => setFairnessModalOpen(false)}
          onVerify={() => {
            setFairnessModalOpen(false);
            navigateToView("fairness");
          }}
        />
      ) : null}

      {pullQueue.length > 1 && (isSpinning || showModal) && (
        <p className="mt-4 text-center text-xs text-muted">
          Pack {queueIndex + 1} of {pullQueue.length}
        </p>
      )}
    </section>
    </CardDetailModalProvider>
  );
}
