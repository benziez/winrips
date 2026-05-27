import { RipBottomSheet } from "./RipBottomSheet";
import { PrismGlyph } from "../../icons/AppIcons";

interface CategorySheetProps {
  open: boolean;
  onClose: () => void;
}

/** MVP: Pokémon only — more categories when catalog expands. */
export function CategorySheet({ open, onClose }: CategorySheetProps) {
  return (
    <RipBottomSheet open={open} onClose={onClose} heightClass="h-auto max-h-[40dvh]" showClose={false}>
      <div className="px-6 pb-8 pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--rip-text-muted)]">
          Category
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[var(--rip-border-strong)] bg-[var(--rip-surface)] p-4 text-left"
        >
          <PrismGlyph size={20} className="text-[var(--rip-green-bright)]" />
          <span className="text-[17px] font-semibold text-white">Pokemon</span>
        </button>
      </div>
    </RipBottomSheet>
  );
}
