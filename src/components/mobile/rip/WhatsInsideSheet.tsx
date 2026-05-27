import { useMemo } from "react";
import type { Pack } from "../../../types";
import { getPackDropTable } from "../../../data/packDropTables";
import { ChevronDown } from "../../icons/AppIcons";
import { RipBottomSheet } from "./RipBottomSheet";
import { RipCardTile } from "./RipCardTile";
import { hapticTabSelect } from "../../../utils/mobileHaptics";

interface WhatsInsideSheetProps {
  pack: Pack | null;
  open: boolean;
  onClose: () => void;
}

export function WhatsInsideSheet({ pack, open, onClose }: WhatsInsideSheetProps) {
  const { recentWins, grails } = useMemo(() => {
    if (!pack) return { recentWins: [], grails: [] };
    const table = getPackDropTable(pack.id);
    const sorted = [...table].sort((a, b) => b.card.value - a.card.value);
    const uniqueCards = new Map<string, (typeof sorted)[0]>();
    for (const entry of sorted) {
      if (!uniqueCards.has(entry.card.id)) uniqueCards.set(entry.card.id, entry);
    }
    const byValue = [...uniqueCards.values()];
    return {
      recentWins: byValue.slice(0, 6).map((e) => e.card),
      grails: byValue.slice(0, 8).map((e) => e.card),
    };
  }, [pack]);

  if (!pack) return null;

  return (
    <RipBottomSheet open={open} onClose={onClose} heightClass="h-[calc(100dvh-5rem)]" showClose={false}>
      <button
        type="button"
        onClick={() => {
          void hapticTabSelect();
          onClose();
        }}
        className="flex w-full justify-center pt-3"
        aria-label="Dismiss"
      >
        <ChevronDown size={32} className="text-white" />
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-10">
        <div className="mt-4 flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--rip-surface)]"
            aria-hidden
          >
            <span className="text-2xl font-bold text-[var(--rip-green-bright)]">WR</span>
          </div>
          <div>
            <p className="text-[17px] text-[var(--rip-text-muted)]">{pack.name}</p>
            <h2 className="text-[32px] font-bold leading-tight text-white">What&apos;s Inside</h2>
          </div>
        </div>

        <section className="mt-8">
          <h3 className="text-[17px] font-bold text-white">100% Buyback Guarantee</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--rip-text-muted)]">
            All collectibles are backed by our buyback guarantee at 100% of Fair Market Value. The
            following is a non-exhaustive list of featured cards that may be included in the pack, the
            full inventory may be accessed through the ToS.
          </p>
        </section>

        <section className="mt-10">
          <h3 className="text-2xl font-bold text-white">Recent Wins</h3>
          <div className="mt-3 border-b border-[var(--rip-border)]" />
          <div className="rip-hide-scrollbar mt-4 flex gap-3 overflow-x-auto pb-2">
            {recentWins.length > 0 ? (
              recentWins.map((card) => <RipCardTile key={card.id} card={card} />)
            ) : (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex h-80 w-72 shrink-0 items-center justify-center rounded-2xl bg-[var(--rip-surface)] text-[var(--rip-text-muted)]"
                  >
                    Featured pull
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h3 className="text-2xl font-bold text-white">Grails</h3>
          <div className="mt-3 border-b border-[var(--rip-border)]" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {grails.length > 0 ? (
              grails.map((card) => (
                <RipCardTile key={card.id} card={card} showPrice={false} className="!w-full" />
              ))
            ) : (
              <>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex aspect-[3/5] items-center justify-center rounded-2xl bg-[var(--rip-surface)] text-[var(--rip-text-muted)]"
                  >
                    Grail
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      </div>
    </RipBottomSheet>
  );
}
