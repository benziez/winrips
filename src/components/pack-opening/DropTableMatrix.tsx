import { useMemo } from "react";
import type { PackCategory } from "../../types";
import { useCardDetailModal } from "../../context/CardDetailModalContext";
import { normalizePackId, resolveDropTableItems } from "../../data/boxCatalog";
import { storeItemToCardDetail } from "../../types/cardDetail";
import { resolveStoreItemImage } from "../../utils/collectibleFallback";
import { DropTableItemCard } from "./DropTableItemCard";
import { sortDropTableItems } from "./dropTableStyles";

interface DropTableMatrixProps {
  packId: string;
  packName?: string;
}

export function DropTableMatrix({ packId, packName }: DropTableMatrixProps) {
  const { openCardDetail } = useCardDetailModal();
  const resolvedPackId = normalizePackId(packId);
  const storeItems = useMemo(
    () => resolveDropTableItems(resolvedPackId) || resolveDropTableItems(packId),
    [packId, resolvedPackId],
  );
  const sortedItems = useMemo(() => sortDropTableItems(storeItems), [storeItems]);
  const showPsa10Badge =
    resolvedPackId === "psa-10-chaser" || normalizePackId(packId) === "psa-10-chaser";

  if (sortedItems.length === 0) {
    return (
      <section className="mt-4 rounded-xl border border-dashed border-border bg-slate px-4 py-10 text-center">
        <p className="text-sm text-muted">
          No drop table items found{packName ? ` for ${packName}` : ""}.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white sm:text-lg">Drop Table</h2>
          <p className="mt-0.5 text-xs text-muted">
            {sortedItems.length} items · full pool odds · tap a card to inspect
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {sortedItems.map((item) => {
          const image = resolveStoreItemImage(item);
          const detail = storeItemToCardDetail(item, image);

          return (
            <DropTableItemCard
              key={item.id}
              name={item.name}
              image={image}
              rarity={item.rarity}
              subtype={item.setName}
              gemValue={item.value}
              probability={item.probability}
              appRarity={item.appRarity}
              category={item.setId as PackCategory}
              detail={detail}
              onSelect={openCardDetail}
              showPsa10Badge={showPsa10Badge}
            />
          );
        })}
      </div>
    </section>
  );
}
