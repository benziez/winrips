import { ChevronDown, PrismGlyph } from "../../icons/AppIcons";
import { hapticTabSelect } from "../../../utils/mobileHaptics";

interface CategorySelectorProps {
  label?: string;
  onPress: () => void;
}

export function CategorySelector({ label = "Pokemon", onPress }: CategorySelectorProps) {
  return (
    <button
      type="button"
      onClick={() => {
        void hapticTabSelect();
        onPress();
      }}
      className="flex items-center gap-2 text-[17px] font-medium text-[var(--rip-text-primary)]"
    >
      <PrismGlyph size={16} className="text-[var(--rip-green-bright)]" />
      <span>{label}</span>
      <ChevronDown size={16} className="text-[var(--rip-text-muted)]" />
    </button>
  );
}
