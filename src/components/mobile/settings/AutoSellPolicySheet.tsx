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
              Request shipping for cards $50+ (flat $25 fulfillment fee, insured)
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
              Cards valued at{" "}
              <strong className="font-bold not-italic text-white">$50 or more</strong> can be
              shipped physically — tap Ship on the card detail screen. Cards under $50 are
              auto-sell only. A flat $25 fulfillment fee applies to all shipments.
            </p>
          </div>
        </div>
      </div>
    </RipBottomSheet>
  );
}
