import { useMemo, useState } from "react";
import type { LobbyCategoryFilter, PackCategory } from "../../types";
import { filterPacksByCategory } from "../../data/packs";
import {
  isComingSoonCategory,
  PACK_CATEGORY_TABS,
} from "../../data/packCategories";
import { HeroBanner } from "./HeroBanner";
import { CategoryFilterBar } from "./CategoryFilterBar";
import { ComingSoonCategoryPanel } from "./ComingSoonCategoryPanel";
import { PackGrid } from "./PackGrid";
import { LiveBetsTable } from "./LiveBetsTable";
import { LobbyFaq } from "./LobbyFaq";

function backdropPacksForCategory(category: PackCategory) {
  return filterPacksByCategory(category);
}

export function PackLobby() {
  const [activeCategory, setActiveCategory] = useState<LobbyCategoryFilter>("all");

  const isLocked = isComingSoonCategory(activeCategory);

  const activePacks = useMemo(
    () => filterPacksByCategory(activeCategory),
    [activeCategory],
  );

  const lockedBackdropPacks = useMemo(() => {
    if (!isLocked) return [];
    return backdropPacksForCategory(activeCategory);
  }, [activeCategory, isLocked]);

  const categoryLabel =
    PACK_CATEGORY_TABS.find((t) => t.id === activeCategory)?.label ?? "All Drops";

  const gridTitle = activeCategory === "all" ? "All Drops" : categoryLabel;

  const dropsLabel = isLocked
    ? "Launching soon"
    : `${activePacks.length} drops active`;

  return (
    <div className="w-full space-y-8">
      <HeroBanner />

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Select Drop Category
          </h3>
          <span className="text-xs text-cyan font-mono tabular-nums">{dropsLabel}</span>
        </div>
        <CategoryFilterBar active={activeCategory} onChange={setActiveCategory} />
      </section>

      <div key={activeCategory} className="pack-grid-fade-in">
        {isLocked ? (
          <ComingSoonCategoryPanel
            category={activeCategory}
            backdropPacks={lockedBackdropPacks}
          />
        ) : activePacks.length === 0 ? (
          <p className="text-sm text-muted text-center py-12 rounded-xl border border-dashed border-border bg-[#121318]">
            No mystery drops in this category yet. Check back soon.
          </p>
        ) : (
          <PackGrid title={gridTitle} packs={activePacks} />
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted px-0.5">
          Recent Orders
        </h2>
        <LiveBetsTable categoryFilter={activeCategory} />
      </section>

      <LobbyFaq />
    </div>
  );
}
