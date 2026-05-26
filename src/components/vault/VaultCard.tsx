import type { VaultedCard } from "../../types";
import { formatGems } from "../../constants/retail";
import { isAppStoreCommerce } from "../../constants/commerce";
import { RarityBadge } from "../ui/RarityBadge";
import { CollectibleImage } from "../ui/CollectibleImage";
import { Button } from "../ui/Button";

interface VaultCardProps {
  card: VaultedCard;
  onExchange: (card: VaultedCard) => void;
}

export function VaultCard({ card, onExchange }: VaultCardProps) {
  return (
    <article className="card-pack data-[shell=mobile]:obsidian-glass flex flex-col overflow-hidden rounded-xl data-[shell=mobile]:border-white/10">
      <div className="relative flex aspect-[2.5/3.5] items-center justify-center border-b border-border bg-[#0A0A0C] p-2 data-[shell=mobile]:border-b data-[shell=mobile]:border-white/10 data-[shell=mobile]:bg-transparent">
        <CollectibleImage
          src={card.image}
          alt={card.name}
          className="h-full w-full object-contain"
          frameClassName="data-[shell=mobile]:bg-transparent data-[shell=mobile]:border-0"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-white">
            {card.name}
          </h3>
          <RarityBadge rarity={card.rarity} />
        </div>
        {!isAppStoreCommerce() ? (
          <p className="text-[10px] font-semibold tabular-nums text-gold">
            {formatGems(card.value)}
          </p>
        ) : null}
        <p className="text-[10px] text-muted data-[shell=mobile]:text-[#A1A1AA]">
          Acquired {card.acquiredAt}
        </p>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="fuchsia"
            size="sm"
            className="text-[10px]"
            onClick={() => onExchange(card)}
          >
            Exchange
          </Button>
          <Button variant="gold" size="sm" className="text-[10px]">
            Ship
          </Button>
        </div>
      </div>
    </article>
  );
}
