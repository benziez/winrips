import { useEffect } from "react";
import type { PackDropEntry } from "../../data/packDropTables";
import { CardDetailModalProvider, useCardDetailModal } from "../../context/CardDetailModalContext";
import { DropTableCard } from "./DropTableCard";

interface FullDropTableModalProps {
  entries: PackDropEntry[];
  packName: string;
  onClose: () => void;
}

const TIER_RANK = { Mythic: 0, Legendary: 1, Epic: 2, Rare: 3, Common: 4 } as const;

function FullDropTableModalContent({
  entries,
  packName,
  onClose,
}: FullDropTableModalProps) {
  const { openCardDetail } = useCardDetailModal();
  const sorted = [...entries].sort((a, b) => {
    const tierDiff = TIER_RANK[a.storeRarity] - TIER_RANK[b.storeRarity];
    if (tierDiff !== 0) return tierDiff;
    return b.card.value - a.card.value;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="full-drop-table-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[min(90vh,820px)] w-full max-w-6xl flex-col rounded-xl border border-border bg-slate shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 id="full-drop-table-title" className="text-lg font-bold tracking-tight text-white">
              Drop Table
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {packName} · {sorted.length} items · tap a card to inspect
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-fuchsia/40 hover:text-white"
            aria-label="Close drop table"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {sorted.map((entry) => (
              <DropTableCard
                key={entry.card.id}
                entry={entry}
                onSelect={openCardDetail}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FullDropTableModal(props: FullDropTableModalProps) {
  return (
    <CardDetailModalProvider>
      <FullDropTableModalContent {...props} />
    </CardDetailModalProvider>
  );
}
