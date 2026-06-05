import { useEffect } from "react";
import { formatGems } from "../../constants/retail";
import { formatProbability } from "../../data/packDropTables";
import type { CardDetailCard } from "../../types/cardDetail";
import { buildCardMarketReference } from "../../utils/cardMarketReference";
import { GemIcon } from "../icons/AppIcons";
import { CollectibleImage } from "../ui/CollectibleImage";
import { DROP_TABLE_RARITY_LABEL } from "./dropTableStyles";

interface CardDetailModalProps {
  card: CardDetailCard;
  onClose: () => void;
}

function rarityDisplayLabel(card: CardDetailCard): string {
  if (card.appRarity === "Ancient Rare") return "Grail";
  return card.rarity;
}

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const tierLabel = rarityDisplayLabel(card);
  const setLabel = card.setName?.trim();
  const marketReference = buildCardMarketReference(card);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-detail-title"
      onClick={onClose}
    >
      <div
        className="relative flex w-[90vw] max-h-[85vh] max-w-sm flex-col overflow-hidden rounded-xl border border-border/80 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-end border-b border-border/60 px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted transition-colors hover:border-fuchsia/40 hover:text-white"
            aria-label="Close card detail"
          >
            Close
          </button>
        </div>

        <div className="flex shrink-0 justify-center px-4 pt-3">
          <CollectibleImage
            src={card.image}
            alt={card.name}
            className="mx-auto h-48 w-auto shrink-0 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] md:h-64"
            frameClassName="h-auto w-auto shrink-0 bg-transparent"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4 text-center">
          <div>
            <p
              className={`text-[9px] font-bold uppercase tracking-[0.14em] ${DROP_TABLE_RARITY_LABEL[card.rarity]}`}
            >
              {tierLabel}
              {setLabel ? ` · ${setLabel}` : ""}
            </p>
            <h2
              id="card-detail-title"
              className="mt-1 text-xl font-bold leading-snug tracking-tight text-white"
            >
              {card.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <div className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1">
              <GemIcon size={12} className="text-gold" />
              <span className="text-xs font-bold tabular-nums text-gold">
                {formatGems(card.gemValue)}
              </span>
            </div>
            {card.probability != null ? (
              <div className="rounded-full border border-border/70 bg-slate-800/80 px-2.5 py-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
                  Pull Rates
                </span>
                <span className="ml-1.5 font-mono text-xs font-bold tabular-nums text-white">
                  {formatProbability(card.probability)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-border/60 bg-slate-800/40 px-3 py-2.5 text-left">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
              Market Reference
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/85">{marketReference}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
