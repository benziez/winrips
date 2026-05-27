import { useMemo, useState } from "react";
import type { Card } from "../../types";
import type { VaultedCard } from "../../types";
import { useApp } from "../../context/AppContext";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { BalancePill } from "./rip/BalancePill";
import { AddFundsModal } from "./rip/AddFundsModal";
import { CardDetailOverlay } from "./rip/CardDetailOverlay";
import { PortfolioGraph } from "./collection/PortfolioGraph";
import { ChevronDown, ChevronRight, GridViewIcon, ListViewIcon } from "../icons/AppIcons";
import { CollectibleImage } from "../ui/CollectibleImage";
import { hapticTabSelect } from "../../utils/mobileHaptics";

type ViewMode = "grid" | "list";
type SortKey = "price-desc" | "price-asc" | "name";

function vaultedToCard(item: VaultedCard): Card {
  return {
    id: item.id,
    name: item.name,
    rarity: item.rarity,
    value: item.value,
    image: item.image,
  };
}

function EmptyCollectionIllustration() {
  return (
    <div className="relative mx-auto h-32 w-40" aria-hidden>
      <div className="absolute left-2 top-4 h-28 w-20 rotate-[-12deg] rounded-xl bg-[var(--rip-surface)]" />
      <div className="absolute left-1/2 top-2 h-28 w-20 -translate-x-1/2 rotate-[4deg] rounded-xl bg-[var(--rip-surface-strong)]" />
      <div className="absolute right-2 top-4 h-28 w-20 rotate-[12deg] rounded-xl bg-[var(--rip-surface)]" />
      <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--rip-bg-elevated)] text-xs font-bold text-[var(--rip-green-bright)]">
        WR
      </div>
    </div>
  );
}

export function MobileCollectionView() {
  const { vaultItems, vaultItemsLoading } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("price-desc");
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const sortedItems = useMemo(() => {
    const items = [...vaultItems];
    items.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "price-asc") return a.value - b.value;
      return b.value - a.value;
    });
    return items;
  }, [vaultItems, sortKey]);

  return (
    <RipAmbientShell>
      <header
        className="flex shrink-0 items-center justify-between px-6 pb-3"
        style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.5rem)" }}
      >
        <h1 className="text-[28px] font-bold leading-tight text-white">My Collection</h1>
        <BalancePill onAddFunds={() => setAddFundsOpen(true)} />
      </header>

      <PortfolioGraph />

      <div className="flex items-center justify-between gap-4 px-6 pb-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex items-center gap-1 text-[14px] font-medium text-white"
          >
            All <ChevronDown size={14} className="text-[var(--rip-text-muted)]" />
          </button>
          <button
            type="button"
            onClick={() => {
              void hapticTabSelect();
              setSortKey((k) => (k === "price-desc" ? "price-asc" : "price-desc"));
            }}
            className="flex items-center gap-1 text-[14px] font-medium text-white"
          >
            ↓ Price <ChevronDown size={14} className="text-[var(--rip-text-muted)]" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void hapticTabSelect();
              setViewMode("list");
            }}
            aria-label="List view"
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              viewMode === "list"
                ? "bg-[var(--rip-surface-strong)] text-white ring-1 ring-[var(--rip-border-strong)]"
                : "text-[var(--rip-text-muted)]"
            }`}
          >
            <ListViewIcon size={20} />
          </button>
          <button
            type="button"
            onClick={() => {
              void hapticTabSelect();
              setViewMode("grid");
            }}
            aria-label="Grid view"
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              viewMode === "grid"
                ? "bg-[var(--rip-surface-strong)] text-white ring-1 ring-[var(--rip-border-strong)]"
                : "text-[var(--rip-text-muted)]"
            }`}
          >
            <GridViewIcon size={20} />
          </button>
        </div>
      </div>
      <div className="mx-6 border-b border-[var(--rip-border)]" />

      <div
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-6"
        style={{ paddingBottom: `calc(${MOBILE_DOCK_CLEARANCE} + 5.5rem)` }}
      >
        {vaultItemsLoading ? (
          <p className="text-center text-[15px] text-[var(--rip-text-muted)]">Loading collection…</p>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16">
            <EmptyCollectionIllustration />
            <p className="mt-8 text-center text-[15px] text-[var(--rip-text-muted)]">
              You don&apos;t have any cards yet.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {sortedItems.map((item) => {
              const card = vaultedToCard(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCard(card)}
                  className="flex aspect-[3/4.2] flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[var(--rip-surface)] to-[var(--rip-bg-elevated)] p-3 text-left"
                >
                  <div className="flex min-h-0 flex-[0.65] items-center justify-center">
                    <CollectibleImage
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="mt-auto pt-2">
                    <p className="text-[16px] font-bold text-[var(--rip-green-bright)]">
                      {formatUsd(gemsToUsd(item.value))}
                    </p>
                    <p className="truncate text-[13px] font-medium text-white">{item.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <ul>
            {sortedItems.map((item) => {
              const card = vaultedToCard(item);
              return (
                <li key={item.id} className="border-b border-[var(--rip-border)]">
                  <button
                    type="button"
                    onClick={() => setSelectedCard(card)}
                    className="flex h-24 w-full items-center gap-4 px-2 text-left"
                  >
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--rip-surface)] p-1">
                      <CollectibleImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-white">{item.name}</p>
                      <p className="text-[17px] font-bold text-[var(--rip-green-bright)]">
                        {formatUsd(gemsToUsd(item.value))}
                      </p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-[var(--rip-text-muted)]" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div
        className="pointer-events-none fixed left-0 right-0 z-30 px-4"
        style={{ bottom: `calc(${MOBILE_DOCK_CLEARANCE} + 0.5rem)` }}
      >
        <p className="rip-surface-glass pointer-events-auto rounded-2xl p-3.5 text-[13px] leading-relaxed text-white backdrop-blur-md">
          Your vaulted cards will be{" "}
          <strong className="font-bold">automatically sold after 7 days</strong> at fair market
          value unless you have them shipped to you.
        </p>
      </div>

      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
      <CardDetailOverlay
        card={selectedCard}
        open={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
      />
    </RipAmbientShell>
  );
}
