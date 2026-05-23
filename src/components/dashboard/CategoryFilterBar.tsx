import type { LobbyCategoryFilter } from "../../types";
import { PACK_CATEGORY_TABS } from "../../data/packCategories";

interface CategoryFilterBarProps {
  active: LobbyCategoryFilter;
  onChange: (category: LobbyCategoryFilter) => void;
}

export function CategoryFilterBar({ active, onChange }: CategoryFilterBarProps) {
  return (
    <nav
      className="w-full -mx-1 px-1"
      aria-label="Pack categories"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {PACK_CATEGORY_TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-md px-4 py-2 text-xs font-semibold tracking-tight transition-all duration-200 sm:text-sm ${
                isActive
                  ? "bg-fuchsia text-white"
                  : "border border-border bg-slate text-muted hover:border-fuchsia/30 hover:bg-slate-elevated hover:text-white"
              }`}
              aria-pressed={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
