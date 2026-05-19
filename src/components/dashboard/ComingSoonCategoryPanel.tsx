import type { Pack } from "../../types";
import {
  COMING_SOON_HEADLINES,
  type ComingSoonCategory,
} from "../../data/packCategories";
import { PackGrid } from "./PackGrid";

interface ComingSoonCategoryPanelProps {
  category: ComingSoonCategory;
  backdropPacks: Pack[];
}

export function ComingSoonCategoryPanel({
  category,
  backdropPacks,
}: ComingSoonCategoryPanelProps) {
  const headline = COMING_SOON_HEADLINES[category];

  return (
    <section className="relative min-h-[320px] overflow-hidden rounded-xl border border-border bg-[#0A0A0C] sm:min-h-[380px]">
      {backdropPacks.length > 0 && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden p-4 sm:p-6 backdrop-blur-md opacity-25"
          aria-hidden
        >
          <PackGrid title="" packs={backdropPacks} showTitle={false} />
        </div>
      )}

      <div className="relative z-10 flex min-h-[320px] flex-col items-center justify-center px-6 py-14 text-center sm:min-h-[380px] sm:px-10">
        <div className="m-0 flex max-w-md flex-col items-center gap-0">
          <h2 className="m-0 text-xl font-black uppercase tracking-[0.12em] text-white sm:text-2xl">
            {headline}
          </h2>

          <span className="mt-4 inline-flex items-center rounded border border-[#FF007F]/50 bg-[#FF007F]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF007F] sm:text-[11px]">
            Launching Q3 2026
          </span>

          <p className="m-0 mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
            Premium certified physical drops and automated verification vaults are
            currently initializing.
          </p>
        </div>
      </div>
    </section>
  );
}
