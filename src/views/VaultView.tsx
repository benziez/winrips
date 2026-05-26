import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  fetchVaultInventoryUnfiltered,
  filterStrictlyVaulted,
} from "../queries/vaultInventory";
import { queryKeys } from "../queries/queryKeys";
import { SessionAuthWall } from "../components/auth/SessionAuthWall";
import { PlayHistoryTable } from "../components/profile/PlayHistoryTable";
import { exchangeButtonLabel, formatGems } from "../constants/retail";
import { isAppStoreCommerce } from "../constants/commerce";
import { CollectibleImage } from "../components/ui/CollectibleImage";
import {
  exchangeVaultItemInUi,
  formatExchangeSuccessToast,
} from "../lib/exchangeLogic";
import type { VaultedCard } from "../types";

const REVENUE_VALUE_THRESHOLD = 10_000;

const PAGE_SHELL =
  "mx-auto w-full max-w-[1600px] space-y-8 overflow-x-hidden px-4 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-4 lg:px-8";

function VaultInventoryCard({
  card,
  onSell,
  onShip,
  isExchanging,
}: {
  card: VaultedCard;
  onSell: (card: VaultedCard) => void;
  onShip: (card: VaultedCard) => void;
  isExchanging: boolean;
}) {
  const isPendingShipment = card.status === "pending_shipment";

  return (
    <article className="vault-door group relative flex flex-col overflow-hidden">
      <div className="relative aspect-[2.5/3.5] w-full bg-slate-elevated/40 p-2 sm:p-3">
        <CollectibleImage
          src={card.image}
          alt={card.name}
          className="h-full w-full object-contain"
        />
        {isPendingShipment ? (
          <div className="absolute inset-x-2 bottom-2 rounded-md border border-gold/30 bg-slate/90 px-2 py-1 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gold">
              Pending Shipment
            </p>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-stretch justify-end gap-1.5 bg-gradient-to-t from-slate/95 via-slate/40 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onShip(card)}
              disabled={isExchanging}
              className="w-full rounded-md bg-[#FF007F] py-1.5 text-xs font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ship
            </button>
            <button
              type="button"
              onClick={() => onSell(card)}
              disabled={isExchanging}
              className="w-full rounded-md border border-border bg-slate-elevated py-1.5 text-[10px] font-bold uppercase leading-tight text-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExchanging ? "Exchanging…" : exchangeButtonLabel(card.value)}
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border bg-slate px-2.5 py-2 sm:px-3">
        <h3 className="line-clamp-2 min-w-0 flex-1 text-[10px] font-bold leading-snug text-white sm:text-xs">
          {card.name}
        </h3>
        {!isAppStoreCommerce() ? (
          <span className="shrink-0 text-[10px] font-bold tabular-nums text-gold sm:text-xs">
            {formatGems(card.value)}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function VaultView() {
  const {
    isLoggedIn,
    userId,
    applyVaultExchange,
    syncGemBalanceFromServer,
    openVaultShipping,
    showCashoutToast,
    showErrorToast,
  } = useApp();
  const { user, authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [exchangingVaultId, setExchangingVaultId] = useState<string | null>(null);

  const hasVaultAccess =
    !authLoading &&
    isAuthenticated &&
    Boolean(user?.id) &&
    isLoggedIn &&
    Boolean(userId) &&
    user!.id === userId;

  const vaultQuery = useQuery({
    queryKey: queryKeys.vault(userId),
    queryFn: () => fetchVaultInventoryUnfiltered(userId),
    enabled: hasVaultAccess,
    select: (data) => filterStrictlyVaulted(data),
  });

  const vaultedInventory = vaultQuery.data ?? [];
  const isLoadingInventory = vaultQuery.isLoading;

  const inventory = hasVaultAccess ? vaultedInventory : [];

  const portfolioValue = useMemo(
    () => inventory.reduce((sum, card) => sum + card.value, 0),
    [inventory],
  );

  const revenueAssets = useMemo(
    () =>
      inventory.filter(
        (card) => card.value >= REVENUE_VALUE_THRESHOLD && card.status !== "pending_shipment",
      ),
    [inventory],
  );

  async function handleSell(card: VaultedCard) {
    if (exchangingVaultId) return;

    if (card.status === "pending_shipment") {
      showCashoutToast("This item is pending shipment and cannot be exchanged.");
      return;
    }

    setExchangingVaultId(card.vaultId);

    try {
      await exchangeVaultItemInUi(card.vaultId, {
        removeVaultItem: (vaultItemId, gemsAdded, serverGemsBalance) => {
          applyVaultExchange(vaultItemId, gemsAdded, serverGemsBalance);
        },
        syncGemBalance: userId
          ? async () => {
              await syncGemBalanceFromServer(userId);
            }
          : undefined,
        toastError: showErrorToast,
        toastSuccess: (gemsAdded) => {
          showCashoutToast(formatExchangeSuccessToast(gemsAdded));
        },
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.vaultAll });
      await queryClient.invalidateQueries({ queryKey: queryKeys.userAll });
    } finally {
      setExchangingVaultId(null);
    }
  }

  function handleShip(card: VaultedCard) {
    if (exchangingVaultId) return;

    if (card.status === "pending_shipment") {
      showCashoutToast("This item is already pending shipment.");
      return;
    }
    openVaultShipping(card);
  }

  function handleShipAllRevenue() {
    const shippableRevenue = revenueAssets.filter((card) => card.status !== "pending_shipment");
    if (shippableRevenue.length === 0) {
      showCashoutToast("No shippable revenue-tier collectibles in your vault locker.");
      return;
    }
    openVaultShipping(shippableRevenue[0]!);
  }

  return (
    <div className={PAGE_SHELL}>
      <header className="relative bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 -mx-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-500/10 via-transparent to-transparent sm:-mx-6 lg:-mx-8"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
              User Hub
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Manage vaulted collectibles and review your complete box opening history in one
              place.
            </p>
          </div>
          <div className="flex min-w-0 flex-col sm:items-end sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Estimated Portfolio Value
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">
              {authLoading ? "…" : portfolioValue.toLocaleString()}{" "}
              <span className="text-lg font-semibold text-muted sm:text-xl">GEMS</span>
            </p>
          </div>
        </div>
      </header>

      {authLoading ? (
        <p className="py-12 text-center text-sm text-muted">Verifying session…</p>
      ) : !hasVaultAccess ? (
        <SessionAuthWall description="Sign in with an active account to view your vault locker. Inventory is tied to your verified session and is never shown to guests." />
      ) : (
        <>
          <section aria-labelledby="vault-inventory-heading">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2
                id="vault-inventory-heading"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted"
              >
                Vault Inventory
              </h2>
              {!isLoadingInventory && inventory.length > 0 ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-muted">
                    <span className="font-semibold tabular-nums text-white">
                      {inventory.length}
                    </span>{" "}
                    {inventory.length === 1 ? "collectible" : "collectibles"}
                  </p>
                  <button
                    type="button"
                    onClick={handleShipAllRevenue}
                    disabled={revenueAssets.length === 0 || Boolean(exchangingVaultId)}
                    className="rounded-md border border-border bg-slate-elevated/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted transition-colors hover:border-fuchsia/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Ship All Revenue Assets
                  </button>
                </div>
              ) : null}
            </div>

            {isLoadingInventory ? (
              <p className="py-16 text-center text-sm text-muted">Loading your vault locker…</p>
            ) : inventory.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-semibold text-white">Your vault is empty</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                  Unlock boxes to build your locker collection, or use Send to Vault after a pull.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
                {inventory.map((card) => (
                  <VaultInventoryCard
                    key={card.vaultId}
                    card={card}
                    onSell={handleSell}
                    onShip={handleShip}
                    isExchanging={exchangingVaultId === card.vaultId}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="vault-activity-heading">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2
                id="vault-activity-heading"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted"
              >
                Recent Activity / Play History
              </h2>
              <span className="rounded border border-fuchsia/30 bg-fuchsia/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-fuchsia">
                Audit Rolls
              </span>
            </div>
            <PlayHistoryTable embedded />
          </section>
        </>
      )}
    </div>
  );
}
