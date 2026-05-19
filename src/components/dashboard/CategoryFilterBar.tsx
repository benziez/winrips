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
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-[#FF007F] text-white shadow-[0_0_16px_rgba(255,0,127,0.35)]"
                  : "bg-[#121318] text-white border border-border hover:bg-[#16171e] hover:text-fuchsia hover:border-fuchsia/30"
              }`}
              aria-pressed={isActive}
            >
              <span className="text-sm" aria-hidden>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
