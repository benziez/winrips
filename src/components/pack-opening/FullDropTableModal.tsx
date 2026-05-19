import { useEffect } from "react";
import type { PackDropEntry } from "../../data/packDropTables";
import { DropTableCard } from "./DropTableCard";

interface FullDropTableModalProps {
  entries: PackDropEntry[];
  packName: string;
  onClose: () => void;
}

export function FullDropTableModal({ entries, packName, onClose }: FullDropTableModalProps) {
  const sorted = [...entries].sort((a, b) => b.card.value - a.card.value);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
        className="relative flex max-h-[min(90vh,820px)] w-full max-w-4xl flex-col rounded-xl border border-border bg-[#121318] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia mb-1">
              Full Odds Disclosure
            </p>
            <h2 id="full-drop-table-title" className="text-lg font-bold text-white">
              Complete Drop Table
            </h2>
            <p className="text-xs text-muted mt-1">
              {packName} · {sorted.length} cards · sorted by Gem value
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-white hover:border-fuchsia/40 transition-colors"
            aria-label="Close full drop table"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {sorted.map((entry) => (
              <DropTableCard key={entry.card.id} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
