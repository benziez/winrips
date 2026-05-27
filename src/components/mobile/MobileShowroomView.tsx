import { useMemo } from "react";
import type { Card } from "../../types";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { useBoxesCatalog } from "../../context/BoxesCatalogContext";
import { buildGlobalCardCatalog } from "../../utils/globalCardCatalog";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../hooks/useFallbackImageSrc";
import { resolveAssetUrl, isRenderableAssetUrl } from "../../utils/resolveAssetUrl";
import { CARD_PLACEHOLDER_IMAGE } from "../../constants/cardAssets";
import { MOBILE_COLORS, OBSIDIAN_GOLD } from "./mobileTheme";
import { MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";
import { GlassSurface } from "./GlassSurface";
import { ObsidianImage } from "./ObsidianImage";

function ShowroomCardTile({ card }: { card: Card }) {
  const remoteSrc = useMemo(() => {
    const trimmed = card.image?.trim() ?? "";
    const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
    return resolveAssetUrl(candidate);
  }, [card.image]);
  const { imgSrc, onError } = useFallbackImageSrc(remoteSrc, IMAGE_PLACEHOLDER);
  const priceLabel = formatUsd(gemsToUsd(card.value));

  return (
    <article className="flex flex-col overflow-hidden">
      <GlassSurface variant="default" className="aspect-[2.5/3.5] w-full overflow-hidden rounded-xl p-0">
        <ObsidianImage
          imgSrc={imgSrc}
          fallbackSrc={IMAGE_PLACEHOLDER}
          alt={card.name}
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
    </article>
  );
}

/** Global gallery of every pullable card, sorted by USD value (high → low). */
export function MobileShowroomView() {
  const { packs, loading } = useBoxesCatalog();

  const cards = useMemo(() => {
    if (loading || packs.length === 0) return [];
    return buildGlobalCardCatalog(packs);
  }, [loading, packs]);

  const isCatalogPending = loading && packs.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-black">
      <header
        className="relative z-10 shrink-0 px-6 pb-3"
        style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
      >
        <h1 className="text-3xl font-semibold tracking-tight text-white">Showroom</h1>
        <p className="mt-1 text-sm font-light" style={{ color: MOBILE_COLORS.textMuted }}>
          Every pullable card · highest value first
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
          <ul className="grid grid-cols-2 gap-4 pb-4 sm:grid-cols-3">
            {cards.map((card) => (
              <li key={card.id}>
                <ShowroomCardTile card={card} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
