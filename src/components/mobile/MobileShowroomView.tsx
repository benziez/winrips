import { useMemo } from "react";
import type { Card } from "../../types";
import type { StoreRarity } from "../../types/store";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { useBoxesCatalog } from "../../context/BoxesCatalogContext";
import { buildGlobalCardCatalog } from "../../utils/globalCardCatalog";
import {
  buildStoreRarityByCardId,
  groupCardsByStoreRarity,
  resolveStoreRarity,
  SHOWROOM_RARITY_ORDER,
} from "../../utils/showroomGrouping";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../hooks/useFallbackImageSrc";
import { resolveAssetUrl, isRenderableAssetUrl } from "../../utils/resolveAssetUrl";
import { CARD_PLACEHOLDER_IMAGE } from "../../constants/cardAssets";
import {
  MOBILE_COLORS,
  OBSIDIAN_GOLD,
  mobileSafeAreaTopStyle,
  storeRarityOuterGlow,
} from "./mobileTheme";
import { MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";
import { GlassSurface } from "./GlassSurface";
import { ObsidianImage } from "./ObsidianImage";

const ROW_LABEL: Record<StoreRarity, string> = {
  Mythic: "Mythic",
  Legendary: "Legendary",
  Epic: "Epic",
  Rare: "Rare",
  Common: "Common",
};

function ShowroomCardTile({
  card,
  storeRarity,
}: {
  card: Card;
  storeRarity: StoreRarity;
}) {
  const remoteSrc = useMemo(() => {
    const trimmed = card.image?.trim() ?? "";
    const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
    return resolveAssetUrl(candidate);
  }, [card.image]);
  const { imgSrc, onError } = useFallbackImageSrc(remoteSrc, IMAGE_PLACEHOLDER);
  const priceLabel = formatUsd(gemsToUsd(card.value));

  return (
    <article
      className="relative w-[140px] shrink-0 overflow-visible"
      style={{ boxShadow: storeRarityOuterGlow(storeRarity) }}
    >
      <GlassSurface variant="default" className="relative z-[1] aspect-[2.5/3.5] w-full overflow-hidden rounded-xl p-0">
        <ObsidianImage
          imgSrc={imgSrc}
          fallbackSrc={IMAGE_PLACEHOLDER}
          alt={card.name}
          onError={onError}
          imgClassName="h-full w-full object-contain object-center"
        />
      </GlassSurface>
      <p className="relative z-[1] mt-2 line-clamp-2 text-center text-xs font-semibold leading-snug text-white">
        {card.name}
      </p>
      <p
        className="relative z-[1] mt-0.5 text-center text-sm font-semibold tabular-nums"
        style={{ color: OBSIDIAN_GOLD.bright }}
      >
        {priceLabel}
      </p>
    </article>
  );
}

function ShowroomRarityRow({
  tier,
  cards,
  storeRarityByCardId,
}: {
  tier: StoreRarity;
  cards: Card[];
  storeRarityByCardId: Map<string, StoreRarity>;
}) {
  return (
    <section className="pb-6">
      <h2
        className="mb-3 px-1 text-[11px] font-bold uppercase tracking-[0.2em]"
        style={{ color: MOBILE_COLORS.textMuted }}
      >
        {ROW_LABEL[tier]}
      </h2>
      <div
        className="-mx-1 flex gap-4 overflow-x-auto overflow-y-visible overscroll-x-contain px-1 py-2"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {cards.map((card) => (
          <ShowroomCardTile
            key={card.id}
            card={card}
            storeRarity={resolveStoreRarity(card, storeRarityByCardId)}
          />
        ))}
      </div>
    </section>
  );
}

/** Global gallery of every pullable card, grouped by store rarity tier. */
export function MobileShowroomView() {
  const { packs, storeItemsByPackId, loading } = useBoxesCatalog();

  const { cards, rows, storeRarityByCardId } = useMemo(() => {
    if (loading || packs.length === 0) {
      return {
        cards: [] as Card[],
        rows: groupCardsByStoreRarity([], new Map()),
        storeRarityByCardId: new Map<string, StoreRarity>(),
      };
    }

    const catalog = buildGlobalCardCatalog(packs);
    const rarityMap = buildStoreRarityByCardId(packs, storeItemsByPackId);
    return {
      cards: catalog,
      rows: groupCardsByStoreRarity(catalog, rarityMap),
      storeRarityByCardId: rarityMap,
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

      <div
        className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4"
        style={{ paddingBottom: MOBILE_DOCK_CLEARANCE }}
      >
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
          <div className="pb-4">
            {visibleRows.map((tier) => (
              <ShowroomRarityRow
                key={tier}
                tier={tier}
                cards={rows[tier]}
                storeRarityByCardId={storeRarityByCardId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
