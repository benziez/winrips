import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { exchangeCreditGems, formatGems } from "../constants/retail";
import { CollectibleImage } from "../components/ui/CollectibleImage";
import type { VaultedCard } from "../types";

const REVENUE_VALUE_THRESHOLD = 10_000;

function VaultInventoryCard({
  card,
  onSell,
  onShip,
}: {
  card: VaultedCard;
  onSell: (card: VaultedCard) => void;
  onShip: (card: VaultedCard) => void;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-[#2A2D34] bg-[#121318]">
      <div className="relative aspect-[2.5/3.5] w-full bg-[#0A0A0C] p-2">
        <CollectibleImage
          src={card.image}
          alt={card.name}
          className="h-full w-full object-contain"
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-stretch justify-end gap-1.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onShip(card)}
            className="w-full rounded-md bg-[#FF007F] py-1.5 text-xs font-bold uppercase text-white"
          >
            Ship
          </button>
          <button
            type="button"
            onClick={() => onSell(card)}
            className="w-full rounded-md border border-[#2A2D34] bg-[#1A1C20] py-1.5 text-xs font-bold uppercase text-[#A0A5B5] transition-colors hover:text-white"
          >
            Sell
          </button>
        </div>
      </div>
      <div className="space-y-0.5 border-t border-[#2A2D34] px-2.5 py-2">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white">
          {card.name}
        </p>
        <p className="text-xs font-bold tabular-nums text-gold">{formatGems(card.value)}</p>
      </div>
    </article>
  );
}

export function VaultView() {
  const { vaultItems, exchangeVaultCard, openVaultShipping, showCashoutToast } = useApp();

  const inventory = vaultItems;

  const portfolioValue = useMemo(
    () => inventory.reduce((sum, card) => sum + card.value, 0),
    [inventory],
  );

  const revenueAssets = useMemo(
    () => inventory.filter((card) => card.value >= REVENUE_VALUE_THRESHOLD),
    [inventory],
  );

  function handleSell(card: VaultedCard) {
    const credit = exchangeCreditGems(card.value);
    exchangeVaultCard(card.vaultId);
    showCashoutToast(
      `Trade-in processed — ${card.name} converted to ${formatGems(credit)} store credit.`,
    );
  }

  function handleShipAllRevenue() {
    if (revenueAssets.length === 0) {
      showCashoutToast("No revenue-tier collectibles in your vault locker.");
      return;
    }
    openVaultShipping(revenueAssets[0]);
    showCashoutToast(
      `Bulk delivery bundle initiated — ${revenueAssets.length} high-value assets queued for secure fulfillment.`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="overflow-hidden rounded-md border border-[#2A2D34] bg-[#1A1C20]">
        <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-2 lg:items-center lg:gap-8">
          <div className="max-w-xl">
            <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
              Your Vault Locker
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#A0A5B5]">
              Manage your accumulated collection assets, request physical secure shipping, or
              instant trade-in.
            </p>
          </div>
          <div className="rounded-md border border-[#2A2D34] bg-[#0A0A0C] px-5 py-4 lg:justify-self-end lg:min-w-[280px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
              Estimated Portfolio Value
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">
              {portfolioValue.toLocaleString()}{" "}
              <span className="text-lg font-semibold text-[#A0A5B5] sm:text-xl">GEMS</span>
            </p>
          </div>
        </div>
      </section>

      {inventory.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#2A2D34] bg-[#121318] px-6 py-16 text-center">
          <p className="text-sm text-[#A0A5B5]">
            Your vault locker is empty. Unlock drops to add authenticated inventory.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#A0A5B5]">
              Showing{" "}
              <span className="font-semibold tabular-nums text-white">{inventory.length}</span>{" "}
              {inventory.length === 1 ? "Collectible" : "Collectibles"}
            </p>
            <button
              type="button"
              onClick={handleShipAllRevenue}
              disabled={revenueAssets.length === 0}
              className="rounded-md border border-[#2A2D34] bg-[#1A1C20] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#A0A5B5] transition-colors hover:border-[#FF007F]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ship All Revenue Assets
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {inventory.map((card) => (
              <VaultInventoryCard
                key={card.vaultId}
                card={card}
                onSell={handleSell}
                onShip={openVaultShipping}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
