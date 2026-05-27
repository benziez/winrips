import { useEffect } from "react";
import { motion } from "framer-motion";
import type { PackDropEntry } from "../../data/packDropTables";
import { CardDetailModalProvider, useCardDetailModal } from "../../context/CardDetailModalContext";
import { DropTableCard } from "./DropTableCard";
import { DropTableListRow } from "./DropTableListRow";

interface FullDropTableModalProps {
  entries: PackDropEntry[];
  packName: string;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  layout?: "grid" | "list";
}

const TIER_RANK = { Mythic: 0, Legendary: 1, Epic: 2, Rare: 3, Common: 4 } as const;

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FullDropTableModalContent({
  entries,
  packName,
  onClose,
  title = "Drop Table",
  subtitle,
  layout = "grid",
}: FullDropTableModalProps) {
  const { openCardDetail } = useCardDetailModal();
  const sorted = [...entries].sort((a, b) => {
    const tierDiff = TIER_RANK[a.storeRarity] - TIER_RANK[b.storeRarity];
    if (tierDiff !== 0) return tierDiff;
    return b.card.value - a.card.value;
  });

  const isList = layout === "list";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (isList) {
    return (
      <motion.div
        className="fixed inset-0 z-[110] flex flex-col bg-zinc-950"
        role="dialog"
        aria-modal="true"
        aria-labelledby="full-drop-table-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <header
          className="flex shrink-0 items-center justify-between gap-2 px-4"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <h2
            id="full-drop-table-title"
            className="min-w-0 truncate text-[17px] font-semibold text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-zinc-400 active:text-white"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        {subtitle || packName ? (
          <p className="shrink-0 px-4 text-xs text-zinc-500">{subtitle ?? packName}</p>
        ) : null}

        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-safe">
          {sorted.map((entry) => (
            <li key={entry.card.id}>
              <DropTableListRow entry={entry} onSelect={openCardDetail} />
            </li>
          ))}
        </ul>
      </motion.div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/90 backdrop-blur-sm sm:items-center"
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
            <h2 id="full-drop-table-title" className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-0.5 text-xs font-light text-zinc-500">
              {subtitle ?? `${packName} · ${sorted.length} items · tap a card to inspect`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-zinc-400 transition-colors hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {sorted.map((entry) => (
              <DropTableCard key={entry.card.id} entry={entry} onSelect={openCardDetail} />
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
