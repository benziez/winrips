import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CardDetailModal } from "../components/pack-opening/CardDetailModal";
import type { CardDetailCard } from "../types/cardDetail";

interface CardDetailModalContextValue {
  openCardDetail: (card: CardDetailCard) => void;
  closeCardDetail: () => void;
}

const CardDetailModalContext = createContext<CardDetailModalContextValue | null>(null);

export function CardDetailModalProvider({ children }: { children: ReactNode }) {
  const [selectedCard, setSelectedCard] = useState<CardDetailCard | null>(null);

  const openCardDetail = useCallback((card: CardDetailCard) => {
    setSelectedCard(card);
  }, []);

  const closeCardDetail = useCallback(() => {
    setSelectedCard(null);
  }, []);

  const value = useMemo(
    () => ({ openCardDetail, closeCardDetail }),
    [openCardDetail, closeCardDetail],
  );

  return (
    <CardDetailModalContext.Provider value={value}>
      {children}
      {selectedCard ? (
        <CardDetailModal card={selectedCard} onClose={closeCardDetail} />
      ) : null}
    </CardDetailModalContext.Provider>
  );
}

export function useCardDetailModal(): CardDetailModalContextValue {
  const context = useContext(CardDetailModalContext);
  if (!context) {
    throw new Error("useCardDetailModal must be used within CardDetailModalProvider");
  }
  return context;
}
