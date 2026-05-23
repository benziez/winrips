import type { PackDropEntry } from "../../data/packDropTables";
import type { CardDetailCard } from "../../types/cardDetail";
import { DropTableItemCard } from "./DropTableItemCard";

interface DropTableCardProps {
  entry: PackDropEntry;
  compact?: boolean;
  onSelect?: (card: CardDetailCard) => void;
}

function entryToCardDetail(entry: PackDropEntry): CardDetailCard {
  const { card, probability, storeRarity } = entry;
  return {
    id: card.id,
    name: card.name,
    image: card.image,
    rarity: storeRarity,
    gemValue: card.value,
    probability,
    appRarity: card.rarity,
  };
}

/** @deprecated compact flag unused — unified Boxed.gg card layout */
export function DropTableCard({ entry, onSelect }: DropTableCardProps) {
  const { card, probability, storeRarity } = entry;
  const detail = entryToCardDetail(entry);

  return (
    <DropTableItemCard
      name={card.name}
      image={card.image}
      rarity={storeRarity}
      gemValue={card.value}
      probability={probability}
      appRarity={card.rarity}
      detail={detail}
      onSelect={onSelect}
    />
  );
}
