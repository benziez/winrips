import { formatUsd, gemsToUsd } from "../../../constants/retail";
import { useApp } from "../../../context/AppContext";
import { hapticTabSelect } from "../../../utils/mobileHaptics";

interface BalancePillProps {
  onAddFunds: () => void;
}

export function BalancePill({ onAddFunds }: BalancePillProps) {
  const { goldVolts } = useApp();
  const balanceLabel = formatUsd(gemsToUsd(goldVolts));

  return (
    <div className="flex h-10 items-stretch overflow-hidden rounded-full">
      <span className="flex items-center bg-[var(--rip-surface)] px-4 text-[15px] font-semibold tabular-nums text-[var(--rip-text-primary)]">
        {balanceLabel}
      </span>
      <button
        type="button"
        onClick={() => {
          void hapticTabSelect();
          onAddFunds();
        }}
        className="flex w-11 shrink-0 items-center justify-center bg-[var(--rip-green)] text-xl font-medium text-white"
        aria-label="Add funds"
      >
        +
      </button>
    </div>
  );
}
