import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "../../types";
import { useApp } from "../../context/AppContext";
import {
  rollCardForPack,
  rollMultiple,
  buildCarouselStrip,
  buildPreviewCarouselStrip,
  resolveWinnerItem,
  ROULETTE_WINNER_INDEX,
  ROULETTE_SPIN_MS,
} from "../../utils/rng";
import { getPackStoreItems, storeItemToCard } from "../../constants/catalog";
import { QuantitySelector, type OpenQuantity } from "./QuantitySelector";
import { UnboxingCarousel } from "./UnboxingCarousel";
import { RevealModal } from "./RevealModal";
import { ShippingModal } from "./ShippingModal";
import { BestDropsTicker } from "./BestDropsTicker";
import { DropTableMatrix } from "./DropTableMatrix";
import { getPackBestDrops } from "../../data/packDropTables";
import { LOBBY_PACK_CATALOG } from "../../constants/packs";
import { exchangeCreditGems, formatGems, RETAIL_COPY } from "../../constants/retail";
import { useIsNarrowViewport } from "../../hooks/useIsNarrowViewport";

const SPIN_DURATION_MS = ROULETTE_SPIN_MS;
const MOBILE_PREVIEW_LENGTH = 3;
const MOBILE_PREVIEW_WINNER_INDEX = 1;
const MOBILE_CARD_WIDTH = 96;

function ceilingCardForPack(packId: string): Card | null {
  const pack = LOBBY_PACK_CATALOG.find((p) => p.id === packId);
  if (!pack) return null;
  const items = getPackStoreItems(pack);
  if (items.length === 0) return null;
  const top = [...items].sort((a, b) => b.value - a.value)[0];
  return storeItemToCard(top);
}

export function PackOpeningView() {
  const {
    selectedPack,
    goToLobby,
    deductPackCost,
    showCashoutToast,
    addGoldVolts,
    shippingModalOpen,
    setShippingModalOpen,
    goldVolts,
  } = useApp();

  const isNarrow = useIsNarrowViewport();
  const isNarrowRef = useRef(isNarrow);
  isNarrowRef.current = isNarrow;

  const [quantity, setQuantity] = useState<OpenQuantity>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [winnerItem, setWinnerItem] = useState<Card | null>(null);
  const [carouselCards, setCarouselCards] = useState<Card[]>([]);
  const [spinKey, setSpinKey] = useState(0);
  const [queue, setQueue] = useState<Card[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

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
  }, [selectedPack?.id, buildIdlePreviewStrip]);

  useEffect(() => {
    if (!selectedPack || isSpinning || showModal) return;
    setCarouselCards(buildIdlePreviewStrip(selectedPack.id));
    setSpinKey((k) => k + 1);
  }, [isNarrow, isSpinning, showModal, buildIdlePreviewStrip, selectedPack?.id]);

  const handleOpenPack = useCallback(() => {
    if (isSpinning || !selectedPack) return;

    const totalCost = selectedPack.cost * quantity;
    if (goldVolts < totalCost) {
      showCashoutToast(`Insufficient ${RETAIL_COPY.currency} for this opening.`);
      return;
    }

    deductPackCost(selectedPack.cost, quantity);

    clearSpinTimer();

    const ceiling = ceilingCardForPack(selectedPack.id);
    const rawPulls =
      quantity === 1
        ? [
            ceiling && Math.random() < 0.15
              ? ceiling
              : rollCardForPack(selectedPack.id),
          ]
        : rollMultiple(quantity, selectedPack.id);

    const pulled = rawPulls.map((card) =>
      resolveWinnerItem(selectedPack.id, card),
    );

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
    selectedPack,
    quantity,
    goldVolts,
    deductPackCost,
    clearSpinTimer,
    showCashoutToast,
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
  const canAfford = goldVolts >= totalCost;
  const packDrops = getPackBestDrops(selectedPack.id);
  const packStoreItems = getPackStoreItems(selectedPack);
  const isPreviewStrip = !isSpinning && carouselCards.length <= MOBILE_PREVIEW_LENGTH;
  const carouselWinnerIndex = isPreviewStrip ? MOBILE_PREVIEW_WINNER_INDEX : ROULETTE_WINNER_INDEX;
  const carouselCardWidth = isNarrow && isPreviewStrip ? MOBILE_CARD_WIDTH : undefined;

  return (
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
          <h1 className="truncate text-base font-bold text-white sm:text-xl">{selectedPack.name}</h1>
          <p className="mt-1 text-sm tracking-wide text-muted">
            {formatGems(selectedPack.cost)} × {quantity} = {formatGems(totalCost)}
          </p>
        </div>
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          disabled={isSpinning || showModal}
        />
      </div>

      <div className="w-full max-w-full space-y-4 overflow-hidden sm:space-y-5">
        <div className="w-full max-w-full overflow-hidden px-0 sm:px-0">
          <UnboxingCarousel
            key={spinKey}
            cards={carouselCards}
            isSpinning={isSpinning}
            winnerIndex={carouselWinnerIndex}
            cardWidth={carouselCardWidth}
          />
        </div>

        <BestDropsTicker drops={packDrops} packName={selectedPack.name} />

        <div className="flex flex-col items-center gap-2 pt-1 sm:gap-3">
          <button
            type="button"
            onClick={handleOpenPack}
            disabled={isSpinning || showModal || !canAfford}
            className="w-full max-w-sm rounded-xl bg-[#FF007F] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
          >
            {isSpinning
              ? "Ripping Pack..."
              : quantity === 1
                ? RETAIL_COPY.purchaseVerb
                : `${RETAIL_COPY.purchaseVerb} × ${quantity}`}
          </button>
          {!canAfford && !isSpinning && (
            <p className="text-xs text-fuchsia">Insufficient {RETAIL_COPY.currency}</p>
          )}
        </div>

        <DropTableMatrix storeItems={packStoreItems} packName={selectedPack.name} />
      </div>

      {showModal && winnerItem && !shippingModalOpen && (
        <RevealModal
          key={winnerItem.id}
          card={winnerItem}
          onBurn={handleBurn}
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

      {queue.length > 1 && (isSpinning || showModal) && (
        <p className="mt-4 text-center text-xs text-muted">
          Pack {queueIndex + 1} of {queue.length}
        </p>
      )}
    </section>
  );
}
