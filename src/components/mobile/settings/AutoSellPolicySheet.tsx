import type { ReactNode } from "react";
import { RipBottomSheet } from "../rip/RipBottomSheet";

interface AutoSellPolicySheetProps {
  open: boolean;
  onClose: () => void;
}

function PolicyOption({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 text-[15px] text-[var(--rip-green-bright)]" aria-hidden>
        →
      </span>
      <p className="text-[15px] leading-relaxed text-[var(--rip-text-primary)]">{children}</p>
    </div>
  );
}

export function AutoSellPolicySheet({ open, onClose }: AutoSellPolicySheetProps) {
  return (
    <RipBottomSheet open={open} onClose={onClose} heightClass="h-auto max-h-[85dvh]">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-14">
        <div className="mt-4 px-6">
          <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--rip-text-muted)]">
            Vault Policy
          </p>
          <h2 className="mt-1 text-[26px] font-bold leading-tight text-white">Auto-Sell Policy</h2>
        </div>

        <div className="mt-6 space-y-5 px-6">
          <p className="text-[15px] leading-relaxed text-[var(--rip-text-primary)]">
            Cards you win are held in your WinRips vault. You have{" "}
            <strong className="font-bold text-white">7 days</strong> to choose what to do with each
            card:
          </p>

          <div className="mt-2 space-y-3">
            <PolicyOption>
              Request shipping to receive the physical card (shipping fees apply)
            </PolicyOption>
            <PolicyOption>
              Sell the card instantly back to WinRips at{" "}
              <strong className="font-bold text-white">85% of Fair Market Value</strong>
            </PolicyOption>
            <PolicyOption>
              Hold the card in your vault — after 7 days, unshipped cards are automatically sold at{" "}
              <strong className="font-bold text-white">85% of Fair Market Value</strong> and the
              proceeds credited to your balance
            </PolicyOption>
          </div>

          <div className="mt-2 border-t border-[var(--rip-border)] pt-5">
            <p className="text-[13px] italic leading-relaxed text-[var(--rip-text-muted)]">
              Physical shipping is coming soon. Until shipping launches, all vaulted cards will
              auto-convert to balance at 85% FMV after 7 days.
            </p>
          </div>
        </div>
      </div>
    </RipBottomSheet>
  );
}
