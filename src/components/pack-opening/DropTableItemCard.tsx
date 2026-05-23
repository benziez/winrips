import type { KeyboardEvent } from "react";
import type { CardDetailCard } from "../../types/cardDetail";
import { formatProbability } from "../../data/packDropTables";
import type { PackCategory } from "../../types";
import type { StoreItem } from "../../types/store";
import { GemIcon } from "../icons/AppIcons";
import { CollectibleImage } from "../ui/CollectibleImage";
import {
  DROP_TABLE_RARITY_LABEL,
  DROP_TABLE_RARITY_SHELL,
  type DropTableRarity,
} from "./dropTableStyles";

export interface DropTableItemCardProps {
  name: string;
  image: string;
  rarity: DropTableRarity;
  gemValue: number;
  probability: number;
  appRarity?: StoreItem["appRarity"];
  subtype?: string;
  category?: PackCategory;
  detail?: CardDetailCard;
  onSelect?: (card: CardDetailCard) => void;
}

function rarityDisplayLabel(rarity: DropTableRarity, appRarity?: StoreItem["appRarity"]): string {
  if (appRarity === "Ancient Rare") return "Grail";
  return rarity;
}

export function DropTableItemCard({
  name,
  image,
  rarity,
  subtype,
  gemValue,
  probability,
  appRarity,
  category,
  detail,
  onSelect,
}: DropTableItemCardProps) {
  const tierLabel = rarityDisplayLabel(rarity, appRarity);
  const topLabel = subtype?.trim() ? `${tierLabel} · ${subtype.trim()}` : tierLabel;
  const isInteractive = Boolean(detail && onSelect);

  function handleClick() {
    if (detail && onSelect) onSelect(detail);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!isInteractive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  }

  return (
    <article
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      aria-label={isInteractive ? `View details for ${name}` : undefined}
      className={`group relative flex min-h-0 flex-col overflow-hidden rounded-md border transition-colors duration-200 sm:min-h-[168px] sm:rounded-lg md:min-h-[180px] ${DROP_TABLE_RARITY_SHELL[rarity]} ${
        isInteractive
          ? "cursor-pointer hover:border-fuchsia/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia/60"
          : "hover:border-fuchsia/40"
      }`}
    >
      <div className="relative flex flex-1 items-center justify-center px-1.5 pb-0.5 pt-2 sm:px-3 sm:pb-1 sm:pt-4 md:px-4 md:pt-5">
        <div className="relative aspect-square w-full max-w-[52px] sm:max-w-[80px] md:max-w-[96px]">
          <CollectibleImage
            src={image}
            alt={name}
            category={category}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
            frameClassName="bg-transparent"
          />
        </div>
      </div>

      <div className="relative mt-auto border-t border-border/50 p-1.5 sm:p-2.5 md:p-3">
        <div className="flex items-end justify-between gap-1 sm:gap-2">
          <div className="min-w-0 flex-1">
            <p
              className={`text-[7px] font-bold uppercase tracking-[0.1em] sm:text-[9px] sm:tracking-[0.14em] ${DROP_TABLE_RARITY_LABEL[rarity]}`}
            >
              {topLabel}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[9px] font-bold leading-tight tracking-tight text-white sm:line-clamp-2 sm:text-[11px] md:text-xs">
              {name}
            </p>
            <p className="mt-0.5 flex items-center gap-0.5 text-[8px] font-bold tabular-nums text-gold sm:mt-1 sm:gap-1 sm:text-[10px] md:text-[11px]">
              <GemIcon size={9} className="text-gold/90 sm:hidden" />
              <GemIcon size={11} className="hidden text-gold/90 sm:block" />
              <span>{gemValue.toLocaleString()}</span>
            </p>
          </div>
          <p className="odds-mono shrink-0 text-right text-[8px] font-bold leading-none text-white/90 sm:text-[10px] md:text-[11px]">
            {formatProbability(probability)}
          </p>
        </div>
      </div>
    </article>
  );
}
