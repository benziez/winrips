import { useMemo, useState } from "react";
import type { Card } from "../../types";
import type { StoreRarity } from "../../types/store";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { useBoxesCatalog } from "../../context/BoxesCatalogContext";
import { buildGlobalCardCatalog } from "../../utils/globalCardCatalog";
import {
  buildStoreRarityByCardId,
  groupCardsByStoreRarity,
  SHOWROOM_RARITY_ORDER,
} from "../../utils/showroomGrouping";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../hooks/useFallbackImageSrc";
import { resolveAssetUrl, isRenderableAssetUrl } from "../../utils/resolveAssetUrl";
import { CARD_PLACEHOLDER_IMAGE } from "../../constants/cardAssets";
import { MOBILE_COLORS, OBSIDIAN_GOLD, mobileSafeAreaTopStyle, storeRarityLabelStyle } from "./mobileTheme";
import { GlassSurface } from "./GlassSurface";
import { ObsidianImage } from "./ObsidianImage";
import { ShowroomCardDetailSheet } from "./ShowroomCardDetailSheet";

const ROW_LABEL: Record<StoreRarity, string> = {
  Mythic: "Mythic",
  Legendary: "Legendary",
  Epic: "Epic",
  Rare: "Rare",
  Common: "Common",
};

type ShowroomSelection = {
  card: Card;
  storeRarity: StoreRarity;
};

function ShowroomCardTile({
  card,
  onSelect,
}: {
  card: Card;
  onSelect: () => void;
}) {
  const remoteSrc = useMemo(() => {
    const trimmed = card.image?.trim() ?? "";
    const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
    return resolveAssetUrl(candidate);
  }, [card.image]);
  const { imgSrc, onError } = useFallbackImageSrc(remoteSrc, IMAGE_PLACEHOLDER);
  const priceLabel = formatUsd(gemsToUsd(card.value));

  return (
    <button
      type="button"
      onClick={onSelect}
      className="relative w-[140px] shrink-0 text-left transition-transform duration-150 active:scale-[0.97]"
      aria-label={`View ${card.name}`}
    >
      <GlassSurface variant="default" className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-xl p-0">
        <ObsidianImage
          imgSrc={imgSrc}
          fallbackSrc={IMAGE_PLACEHOLDER}
          alt=""
          onError={onError}
          imgClassName="h-full w-full object-contain object-center"
        />
      </GlassSurface>
      <p className="mt-2 line-clamp-2 text-center text-xs font-semibold leading-snug text-white">
        {card.name}
      </p>
      <p
        className="mt-0.5 text-center text-sm font-semibold tabular-nums"
        style={{ color: OBSIDIAN_GOLD.bright }}
      >
        {priceLabel}
      </p>
    </button>
  );
}

function ShowroomRarityRow({
  tier,
  cards,
  onSelectCard,
}: {
  tier: StoreRarity;
  cards: Card[];
  onSelectCard: (card: Card, storeRarity: StoreRarity) => void;
}) {
  return (
    <section className="pb-4 last:pb-1">
      <h2
        className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.2em]"
        style={storeRarityLabelStyle(tier)}
      >
        {ROW_LABEL[tier]}
      </h2>
      <div
        className="-mx-1 flex gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {cards.map((card) => (
          <ShowroomCardTile
            key={card.id}
            card={card}
            onSelect={() => onSelectCard(card, tier)}
          />
        ))}
      </div>
    </section>
  );
}

/** Global gallery of every pullable card, grouped by store rarity tier. */
export function MobileShowroomView() {
  const { packs, storeItemsByPackId, loading } = useBoxesCatalog();
  const [selection, setSelection] = useState<ShowroomSelection | null>(null);

  const { cards, rows } = useMemo(() => {
    if (loading || packs.length === 0) {
      return {
        cards: [] as Card[],
        rows: groupCardsByStoreRarity([], new Map()),
      };
    }

    const catalog = buildGlobalCardCatalog(packs);
    const rarityMap = buildStoreRarityByCardId(packs, storeItemsByPackId);
    return {
      cards: catalog,
      rows: groupCardsByStoreRarity(catalog, rarityMap),
    };
  }, [loading, packs, storeItemsByPackId]);

  const visibleRows = useMemo(
    () => SHOWROOM_RARITY_ORDER.filter((tier) => rows[tier].length > 0),
    [rows],
  );

  const isCatalogPending = loading && packs.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-black">
      <header className="relative z-10 shrink-0 px-6 pb-3" style={mobileSafeAreaTopStyle}>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Showroom</h1>
        <p className="mt-1 text-sm font-light" style={{ color: MOBILE_COLORS.textMuted }}>
          Five tiers · swipe each row to explore
        </p>
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2">
        {isCatalogPending ? (
          <p
            className="flex min-h-[40dvh] items-center justify-center text-sm"
            style={{ color: MOBILE_COLORS.textMuted }}
          >
            Loading showroom…
          </p>
        ) : cards.length === 0 ? (
          <p
            className="flex min-h-[40dvh] items-center justify-center text-sm"
            style={{ color: MOBILE_COLORS.textMuted }}
          >
            No cards available yet.
          </p>
        ) : (
          <div>
            {visibleRows.map((tier) => (
              <ShowroomRarityRow
                key={tier}
                tier={tier}
                cards={rows[tier]}
                onSelectCard={(card, storeRarity) => setSelection({ card, storeRarity })}
              />
            ))}
          </div>
        )}
      </div>

      {selection ? (
        <ShowroomCardDetailSheet
          card={selection.card}
          storeRarity={selection.storeRarity}
          open
          onClose={() => setSelection(null)}
        />
      ) : null}
    </div>
  );
}
