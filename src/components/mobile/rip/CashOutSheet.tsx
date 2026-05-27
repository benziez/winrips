import { useState } from "react";
import { formatUsd, gemsToUsd } from "../../../constants/retail";
import { useApp } from "../../../context/AppContext";
import { RipBottomSheet } from "./RipBottomSheet";
import { hapticMediumImpact } from "../../../utils/mobileHaptics";

interface CashOutSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CashOutSheet({ open, onClose }: CashOutSheetProps) {
  const { goldVolts, showErrorToast } = useApp();
  const [amount, setAmount] = useState("");
  const maxUsd = gemsToUsd(goldVolts);

  async function handleWithdraw() {
    void hapticMediumImpact();
    showErrorToast("Withdrawals coming soon. We'll notify you when this opens up.");
    onClose();
  }

  return (
    <RipBottomSheet open={open} onClose={onClose} heightClass="h-auto max-h-[55dvh]">
      <div className="px-6 pb-8 pt-14">
        <h2 className="text-2xl font-bold text-white">Cash Out</h2>
        <p className="mt-2 text-[15px] text-[var(--rip-text-muted)]">
          Available: {formatUsd(maxUsd)}
        </p>
        <label className="mt-6 block">
          <span className="text-[13px] font-medium text-[var(--rip-text-muted)]">Amount (USD)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={formatUsd(maxUsd)}
            className="mt-2 w-full rounded-2xl border border-[var(--rip-border)] bg-[var(--rip-surface)] px-4 py-3 text-[17px] text-white outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => void handleWithdraw()}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-[var(--rip-green)] text-[17px] font-semibold text-white"
        >
          Withdraw
        </button>
      </div>
    </RipBottomSheet>
  );
}
