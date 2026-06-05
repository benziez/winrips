import { memo, useMemo, useRef, useState } from "react";
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
import { MobileSignInPromptCard } from "./MobileSignInPromptCard";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import { ProgressiveLoadFooter } from "../ui/ProgressiveLoadFooter";
import { useProgressiveRender } from "../../hooks/useProgressiveRender";

type ViewMode = "grid" | "list";
type SortKey = "price-desc" | "price-asc" | "name";

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

export const MobileCollectionView = memo(function MobileCollectionView({
  isActive: _tabActive = true,
}: {
  isActive?: boolean;
}) {
  void _tabActive;
  const { vaultItems, vaultItemsLoading, isLoggedIn } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("price-desc");
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [selectedVaultItem, setSelectedVaultItem] = useState<VaultedCard | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sortedItems = useMemo(() => {
    const items = [...vaultItems];
    items.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "price-asc") return a.value - b.value;
      return b.value - a.value;
    });
    return items;
  }, [vaultItems, sortKey]);

  const {
    visibleItems: visibleCollectionItems,
    hasMore: hasMoreCollectionItems,
    remaining: remainingCollectionItems,
    loadMore: loadMoreCollectionItems,
    sentinelRef: collectionSentinelRef,
  } = useProgressiveRender(sortedItems, scrollRef);

  return (
    <RipAmbientShell>
      <header
        className="flex shrink-0 items-center justify-between px-6 pb-3"
        style={{ paddingTop: "calc(max(0.5rem, env(safe-area-inset-top)) + 0.5rem)" }}
      >
        <h1 className="text-[28px] font-bold leading-tight text-white">My Collection</h1>
        <BalancePill onAddFunds={() => setAddFundsOpen(true)} />
      </header>

      {!isLoggedIn ? (
        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ paddingBottom: MOBILE_DOCK_CLEARANCE }}
        >
          <MobileSignInPromptCard
            message="Sign in to view your collection"
            className="mt-4"
          />
          <div className="flex flex-col items-center justify-center px-8 pt-12 text-center">
            <EmptyCollectionIllustration />
            <p className="mt-6 text-[15px] text-[var(--rip-text-muted)]">
              Open packs and vault real cards after you sign in.
            </p>
          </div>
        </div>
      ) : (
      <div
        ref={scrollRef}
        className="h-full min-h-0 flex-1 transform-gpu overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ paddingBottom: MOBILE_DOCK_CLEARANCE }}
      >
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

        <div className="px-4 pt-6 pb-6">
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
            <>
              <div className="grid grid-cols-2 gap-4">
                {visibleCollectionItems.map((item, index) => (
                  <button
                    key={item.vaultId}
                    type="button"
                    onClick={() => setSelectedVaultItem(item)}
                    className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[var(--rip-surface)] to-[var(--rip-bg-elevated)] p-3 text-left"
                  >
                    <div className="flex aspect-[3/4] w-full items-center justify-center">
                      <CollectibleImage
                        src={item.image}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                        priority={index < 4}
                        loading="eager"
                        width={150}
                        height={200}
                        aspectRatio="3 / 4"
                      />
                    </div>
                    <div className="pt-2">
                      <p className="text-[16px] font-bold text-[var(--rip-green-bright)]">
                        {formatUsd(gemsToUsd(item.value))}
                      </p>
                      <p className="truncate text-[13px] font-medium text-white">{item.name}</p>
                    </div>
                  </button>
                ))}
              </div>
              <ProgressiveLoadFooter
                sentinelRef={collectionSentinelRef}
                hasMore={hasMoreCollectionItems}
                remaining={remainingCollectionItems}
                onLoadMore={loadMoreCollectionItems}
              />
            </>
          ) : (
            <>
              <ul className="divide-y divide-[var(--rip-border)]">
                {visibleCollectionItems.map((item) => (
                  <li key={item.vaultId}>
                    <button
                      type="button"
                      onClick={() => setSelectedVaultItem(item)}
                      className="flex h-24 w-full items-center gap-4 px-2 text-left"
                    >
                      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--rip-surface)] p-1">
                        <CollectibleImage
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain"
                          loading="eager"
                          width={64}
                          height={80}
                          aspectRatio="4 / 5"
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
                ))}
              </ul>
              <ProgressiveLoadFooter
                sentinelRef={collectionSentinelRef}
                hasMore={hasMoreCollectionItems}
                remaining={remainingCollectionItems}
                onLoadMore={loadMoreCollectionItems}
              />
            </>
          )}
        </div>
      </div>
      )}

      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
      <CardDetailOverlay
        card={selectedVaultItem}
        open={Boolean(selectedVaultItem)}
        onClose={() => setSelectedVaultItem(null)}
      />
    </RipAmbientShell>
  );
});
