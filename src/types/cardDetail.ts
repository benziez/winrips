import type { Rarity } from "./index";
import type { StoreItem, StoreRarity } from "./store";

export interface CardDetailCard {
  id: string;
  name: string;
  image: string;
  rarity: StoreRarity;
  gemValue: number;
  probability?: number;
  appRarity?: Rarity;
  setName?: string;
  tcgMarketUsd?: number;
  number?: string;
}

export function storeItemToCardDetail(item: StoreItem, image?: string): CardDetailCard {
  return {
    id: item.id,
    name: item.name,
    image: image ?? item.image,
    rarity: item.rarity,
    gemValue: item.value,
    probability: item.probability,
    appRarity: item.appRarity,
    setName: item.setName,
    tcgMarketUsd: item.tcgMarketUsd,
    number: item.number,
  };
}
