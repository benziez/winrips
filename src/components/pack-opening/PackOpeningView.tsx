import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "../../types";
import { useApp } from "../../context/AppContext";
import { recordPlayHistory } from "../../lib/playHistory";
import { handleSpin } from "../../lib/spinLogic";
import {
  exchangeVaultItemInUi,
  formatExchangeSuccessToast,
} from "../../lib/exchangeLogic";
import {
  rollMultipleWithRoll,
  buildCarouselStrip,
  buildPreviewCarouselStrip,
  resolveWinnerItem,
  ROULETTE_WINNER_INDEX,
  ROULETTE_SPIN_MS,
} from "../../utils/rng";
import { getPackStoreItems } from "../../constants/catalog";
import { QuantitySelector, type OpenQuantity } from "./QuantitySelector";
import { UnboxingCarousel } from "./UnboxingCarousel";
import { RevealModal } from "./RevealModal";
import { ShippingModal } from "./ShippingModal";
import { DropTableMatrix } from "./DropTableMatrix";
import { formatGems, RETAIL_COPY } from "../../constants/retail";
import { useIsNarrowViewport } from "../../hooks/useIsNarrowViewport";
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
  } = useApp();

  const isGuest = !userId;

  const isNarrow = useIsNarrowViewport();
  const isNarrowRef = useRef(isNarrow);
  isNarrowRef.current = isNarrow;

  const [quantity, setQuantity] = useState<OpenQuantity>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isChargingSpin, setIsChargingSpin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [winnerItem, setWinnerItem] = useState<Card | null>(null);
  const [carouselCards, setCarouselCards] = useState<Card[]>([]);
  const [spinKey, setSpinKey] = useState(0);
  const [queue, setQueue] = useState<Card[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [pullVaultIds, setPullVaultIds] = useState<string[]>([]);
  const [isExchanging, setIsExchanging] = useState(false);
  const [fairnessSession, setFairnessSession] = useState<FairnessSession | null>(null);
  const [fairnessModalOpen, setFairnessModalOpen] = useState(false);

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
    setWinnerItem(null);
    setQueue([]);
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
      showCashoutToast(`Insufficient ${RETAIL_COPY.currency} for this opening.`);
      return;
    }

    if (!isGuest && userId) {
      setIsChargingSpin(true);
      setSpinInProgress(true);
      const vaultIds: string[] = [];
      try {
        const rollResults = rollMultipleWithRoll(quantity, selectedPack.id);
        const pulled = rollResults.map((result) =>
          resolveWinnerItem(selectedPack.id, result.card),
        );

        for (let index = 0; index < pulled.length; index += 1) {
          const won = pulled[index]!;
          const spinResult = await handleSpin(selectedPack.cost, {
            itemId: won.id,
            itemName: won.name,
            gemValue: won.value,
            imageUrl: won.image,
          });
          if (!spinResult.ok) {
            showCashoutToast(spinResult.error);
            setSpinInProgress(false);
            return;
          }
          setGoldVolts(spinResult.gemsBalance);

          if (spinResult.vaultItemId) {
            appendVaultPullFromSpin({
              vaultId: spinResult.vaultItemId,
              id: won.id,
              name: won.name,
              rarity: won.rarity,
              value: won.value,
              image: won.image,
              acquiredAt: new Date().toISOString(),
              status: "vaulted",
            });
            vaultIds.push(spinResult.vaultItemId);
          } else if (spinResult.vaultPending) {
            showCashoutToast(
              spinResult.vaultPendingMessage ??
                "Spin succeeded but vaulting is pending.",
            );
          }
        }

        setPullVaultIds(vaultIds);

        void commitFairnessSession(selectedPack.id, rollResults[0]!.rolledNumber).then(
          setFairnessSession,
        );

        if (userId) {
          for (const result of rollResults) {
            const won = resolveWinnerItem(selectedPack.id, result.card);
            void recordPlayHistory({
              userId,
              packName: selectedPack.name,
              spinCost: selectedPack.cost,
              wonItemName: won.name,
              wonItemValue: won.value,
              wonItemImage: won.image,
              rolledNumber: result.rolledNumber,
            }).then(() => {
              window.dispatchEvent(new Event("winrips:play-history-updated"));
            });
          }
        }

        const activeWinner = pulled[0];
        const { strip, winnerItem: centerWinner } = buildCarouselStrip(
          activeWinner,
          selectedPack.id,
        );

        setQueue(pulled);
        setQueueIndex(0);
        setWinnerItem(centerWinner);
        setCarouselCards(strip);
        setShowModal(false);
        setSpinKey((k) => k + 1);
        setIsSpinning(true);
        beginCarouselSpin();
      } finally {
        setIsChargingSpin(false);
      }
      return;
    }

    clearSpinTimer();

    const rollResults = rollMultipleWithRoll(quantity, selectedPack.id);
    void commitFairnessSession(selectedPack.id, rollResults[0]!.rolledNumber).then(
      setFairnessSession,
    );

    const pulled = rollResults.map((result) =>
      resolveWinnerItem(selectedPack.id, result.card),
    );

    if (userId) {
      for (const result of rollResults) {
        const won = resolveWinnerItem(selectedPack.id, result.card);
        void recordPlayHistory({
          userId,
          packName: selectedPack.name,
          spinCost: selectedPack.cost,
          wonItemName: won.name,
          wonItemValue: won.value,
          wonItemImage: won.image,
          rolledNumber: result.rolledNumber,
        }).then(() => {
          window.dispatchEvent(new Event("winrips:play-history-updated"));
        });
      }
    }

    const activeWinner = pulled[0];
    const { strip, winnerItem: centerWinner } = buildCarouselStrip(
      activeWinner,
      selectedPack.id,
    );

    setQueue(pulled);
    setQueueIndex(0);
    setWinnerItem(centerWinner);
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
  ]);

  const finishReveal = useCallback(() => {
    setShowModal(false);
    clearSpinTimer();

    if (queueIndex < queue.length - 1 && selectedPack) {
      const nextIndex = queueIndex + 1;
      const nextCard = queue[nextIndex];
      const { strip, winnerItem: centerWinner } = buildCarouselStrip(
        nextCard,
        selectedPack.id,
      );

      setQueueIndex(nextIndex);
      setWinnerItem(centerWinner);
      setCarouselCards(strip);
      setSpinKey((k) => k + 1);
      setIsSpinning(true);
      setShippingModalOpen(false);
      beginCarouselSpin();
    } else {
      setWinnerItem(null);
      setQueue([]);
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
  }, [queue, queueIndex, clearSpinTimer, setShippingModalOpen, selectedPack, buildIdlePreviewStrip, setSpinInProgress, beginCarouselSpin]);

  const handleBurn = useCallback(async () => {
    if (!winnerItem || isGuest || isExchanging) return;

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
    winnerItem,
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
    if (!winnerItem || isGuest || isExchanging) return;
    showCashoutToast(`${winnerItem.name} secured in your vault locker.`);
    finishReveal();
  }, [winnerItem, isGuest, isExchanging, showCashoutToast, finishReveal]);

  const handleShip = useCallback(() => {
    setShippingModalOpen(true);
  }, [setShippingModalOpen]);

  const handleShippingDone = useCallback(() => {
    setShippingModalOpen(false);
    finishReveal();
  }, [setShippingModalOpen, finishReveal]);

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

  const totalCost = selectedPack.cost * quantity;
  const canAfford = isGuest || goldVolts >= totalCost;
  const openButtonLabel = isChargingSpin
    ? "Charging Gems..."
    : isSpinning
    ? "Ripping Pack..."
    : isGuest
      ? quantity === 1
        ? "Demo Spin"
        : `Demo Spin × ${quantity}`
      : quantity === 1
        ? RETAIL_COPY.purchaseVerb
        : `${RETAIL_COPY.purchaseVerb} × ${quantity}`;
  const packStoreItems = getPackStoreItems(selectedPack);
  const isPreviewStrip = !isSpinning && carouselCards.length <= MOBILE_PREVIEW_LENGTH;
  const carouselWinnerIndex = isPreviewStrip ? MOBILE_PREVIEW_WINNER_INDEX : ROULETTE_WINNER_INDEX;
  const carouselCardWidth = isNarrow && isPreviewStrip ? MOBILE_CARD_WIDTH : undefined;
  const activeVaultItemId = pullVaultIds[queueIndex] ?? null;
  const canExchangeReveal = !isGuest && Boolean(activeVaultItemId);

  return (
    <CardDetailModalProvider>
    <section className="mx-auto w-full max-w-[1600px] overflow-x-hidden px-2 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={goToLobby}
            className="mb-2 flex items-center gap-1 text-xs text-muted hover:text-fuchsia"
          >
            ← Back to lobby
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-base font-bold text-white sm:text-xl">
              {selectedPack.name}
            </h1>
            {fairnessSession ? (
              <FairnessVerifiedBadge onClick={() => setFairnessModalOpen(true)} />
            ) : null}
          </div>
          <p className="mt-1 text-sm tracking-wide text-muted">
            {formatGems(selectedPack.cost)} × {quantity} = {formatGems(totalCost)}
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
              disabled={isSpinning || isChargingSpin || showModal || !canAfford}
              className="w-full max-w-sm rounded-xl bg-[#FF007F] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
            >
              {openButtonLabel}
            </button>
            {isGuest && !isSpinning && !showModal ? (
              <p className="text-xs text-muted">Free preview — same odds as live opens</p>
            ) : null}
            {!isGuest && !canAfford && !isSpinning && (
              <p className="text-xs text-fuchsia">Insufficient {RETAIL_COPY.currency}</p>
            )}
          </div>
        </div>

        <DropTableMatrix storeItems={packStoreItems} packName={selectedPack.name} />
      </div>

      {showModal && winnerItem && !shippingModalOpen && (
        <RevealModal
          key={winnerItem.id}
          card={winnerItem}
          isGuest={isGuest}
          isExchanging={isExchanging}
          canExchange={canExchangeReveal}
          onBurn={() => void handleBurn()}
          onSendToVault={handleSendToVault}
          onShip={handleShip}
          onClose={finishReveal}
        />
      )}

      {shippingModalOpen && winnerItem && (
        <ShippingModal
          itemName={winnerItem.name}
          onClose={() => setShippingModalOpen(false)}
          onSubmit={handleShippingDone}
        />
      )}

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

      {queue.length > 1 && (isSpinning || showModal) && (
        <p className="mt-4 text-center text-xs text-muted">
          Pack {queueIndex + 1} of {queue.length}
        </p>
      )}
    </section>
    </CardDetailModalProvider>
  );
}
