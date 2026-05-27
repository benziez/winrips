import type { PackDropEntry } from "../../data/packDropTables";
import { formatProbability } from "../../data/packDropTables";
import type { CardDetailCard } from "../../types/cardDetail";
import type { StoreItem } from "../../types/store";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { resolveAssetUrl, isRenderableAssetUrl } from "../../utils/resolveAssetUrl";
import { CARD_PLACEHOLDER_IMAGE } from "../../constants/cardAssets";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../hooks/useFallbackImageSrc";
interface DropTableListRowProps {
  entry: PackDropEntry;
  onSelect?: (card: CardDetailCard) => void;
}

function rarityLabel(rarity: StoreItem["rarity"], appRarity?: string): string {
  if (appRarity === "Ancient Rare") return "Grail";
  return rarity;
}

function entryToDetail(entry: PackDropEntry): CardDetailCard {
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

export function DropTableListRow({ entry, onSelect }: DropTableListRowProps) {
  const { card, probability, storeRarity } = entry;
  const tier = rarityLabel(storeRarity, card.rarity);
  const detail = entryToDetail(entry);
  const priceLabel = formatUsd(gemsToUsd(card.value));

  const remoteSrc = (() => {
    const trimmed = card.image?.trim() ?? "";
    const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
    return resolveAssetUrl(candidate);
  })();

  const { imgSrc, onError } = useFallbackImageSrc(remoteSrc, IMAGE_PLACEHOLDER);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(detail)}
      className="flex w-full items-center gap-3 bg-transparent py-3 text-left active:opacity-80"
    >
      <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md">
        <img
          src={imgSrc}
          alt=""
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={onError}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[15px] font-medium leading-snug text-white">{card.name}</p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          {tier}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-medium tabular-nums text-zinc-400">{priceLabel}</p>
        <p className="mt-0.5 text-xs tabular-nums text-zinc-400">
          {formatProbability(probability)}
        </p>
      </div>
    </button>
  );
}
