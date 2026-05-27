import type { OddsMode } from "./adjustOdds";
import { ODDS_MODE_OPTIONS } from "./adjustOdds";
import { RipBottomSheet } from "./RipBottomSheet";
import { CheckIcon } from "../../icons/AppIcons";
import { hapticTabSelect } from "../../../utils/mobileHaptics";

interface AdjustOddsSheetProps {
  open: boolean;
  onClose: () => void;
  selected: OddsMode;
  onSelect: (mode: OddsMode) => void;
}

export function AdjustOddsSheet({ open, onClose, selected, onSelect }: AdjustOddsSheetProps) {
  return (
    <RipBottomSheet open={open} onClose={onClose} heightClass="h-[50dvh]">
      <div className="px-6 pb-8 pt-14">
        <h2 className="text-2xl font-bold text-white">Adjust Odds</h2>
        <div className="mt-6 flex flex-col gap-3">
          {ODDS_MODE_OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  void hapticTabSelect();
                  onSelect(option.id);
                  onClose();
                }}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left ${
                  isSelected
                    ? "border-[var(--rip-border-strong)] bg-[var(--rip-surface)]"
                    : "border-transparent bg-[var(--rip-surface)]"
                }`}
              >
                <div>
                  <p className="text-[17px] font-semibold text-white">{option.label}</p>
                  <p className="mt-1 text-[15px] text-[var(--rip-text-muted)]">{option.subtitle}</p>
                </div>
                {isSelected ? <CheckIcon size={20} className="text-white" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </RipBottomSheet>
  );
}
