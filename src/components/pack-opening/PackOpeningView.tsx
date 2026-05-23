import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "../../types";
import { useApp } from "../../context/AppContext";
import { recordPlayHistory } from "../../lib/playHistory";
import { processSpinTransaction } from "../../lib/spinLogic";
import { cardToVaultedCard } from "../../lib/vaultItems";
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
import { exchangeCreditGems, formatGems, RETAIL_COPY } from "../../constants/retail";
import { useIsNarrowViewport } from "../../hooks/useIsNarrowViewport";
import { FairnessVerifiedBadge } from "./FairnessVerifiedBadge";
import { FairnessVerifyModal } from "./FairnessVerifyModal";
import {
  buildPendingFairnessSession,
  commitFairnessSession,
  type FairnessSession,
} from "../../utils/provablyFair";
import { CardDetailModalProvider } from "../../context/CardDetailModalContext";

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
    addGoldVolts,
    addVaultCard,
    shippingModalOpen,
    setShippingModalOpen,
    goldVolts,
    userId,
    navigateToView,
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
  const [fairnessSession, setFairnessSession] = useState<FairnessSession | null>(null);
  const [fairnessModalOpen, setFairnessModalOpen] = useState(false);

  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearSpinTimer = useCallback(() => {
    if (spinTimerRef.current) {
      clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearSpinTimer(), [clearSpinTimer]);

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

    const totalCost = selectedPack.cost * quantity;
    if (!isGuest && goldVolts < totalCost) {
      showCashoutToast(`Insufficient ${RETAIL_COPY.currency} for this opening.`);
      return;
    }

    if (!isGuest && userId) {
      setIsChargingSpin(true);
      try {
        const chargeResult = await processSpinTransaction(userId, totalCost);
        if (!chargeResult.ok) {
          showCashoutToast(chargeResult.error);
          return;
        }
        setGoldVolts(chargeResult.gemsBalance);
      } finally {
        setIsChargingSpin(false);
      }
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

    spinTimerRef.current = setTimeout(() => {
      setIsSpinning(false);
      setShowModal(true);
      spinTimerRef.current = null;
    }, SPIN_DURATION_MS);
  }, [
    isSpinning,
    isChargingSpin,
    selectedPack,
    quantity,
    isGuest,
    goldVolts,
    setGoldVolts,
    clearSpinTimer,
    showCashoutToast,
    userId,
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

      spinTimerRef.current = setTimeout(() => {
        setIsSpinning(false);
        setShowModal(true);
        spinTimerRef.current = null;
      }, SPIN_DURATION_MS);
    } else {
      setWinnerItem(null);
      setQueue([]);
      setQueueIndex(0);
      setIsSpinning(false);
      setShippingModalOpen(false);
      if (selectedPack) {
        setCarouselCards(buildIdlePreviewStrip(selectedPack.id));
        setSpinKey((k) => k + 1);
      } else {
        setCarouselCards([]);
      }
    }
  }, [queue, queueIndex, clearSpinTimer, setShippingModalOpen, selectedPack, buildIdlePreviewStrip]);

  const handleBurn = useCallback(() => {
    if (!winnerItem) return;
    const payout = exchangeCreditGems(winnerItem.value);
    addGoldVolts(payout);
    showCashoutToast(
      `Exchanged ${winnerItem.name} — +${formatGems(payout)} credited (90% buyback)`,
    );
    finishReveal();
  }, [winnerItem, addGoldVolts, showCashoutToast, finishReveal]);

  const handleSendToVault = useCallback(() => {
    if (!winnerItem || isGuest) return;
    const vaulted = cardToVaultedCard(winnerItem);
    addVaultCard(vaulted);
    showCashoutToast(`${winnerItem.name} secured in your vault locker.`);
    finishReveal();
  }, [winnerItem, isGuest, addVaultCard, showCashoutToast, finishReveal]);

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
          onBurn={handleBurn}
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
