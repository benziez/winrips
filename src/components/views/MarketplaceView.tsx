import { CARD_POOL } from "../../data/cards";
import { formatGems } from "../../constants/retail";
import { AssetImage } from "../ui/AssetImage";
import { UtilityPageShell } from "./UtilityPageShell";

function topCard(offset: number) {
  const sorted = [...CARD_POOL].sort((a, b) => b.value - a.value);
  return sorted[offset] ?? sorted[0];
}

const LISTINGS = [
  { id: "m1", card: topCard(0), seller: "VaultKing" },
  { id: "m2", card: topCard(2), seller: "NeonFox" },
  { id: "m3", card: topCard(1), seller: "WhaleDrop" },
  { id: "m4", card: topCard(5), seller: "SweepLord" },
];

export function MarketplaceView() {
  return (
    <UtilityPageShell
      eyebrow="Peer-to-Peer"
      title="Marketplace"
      description="Buy and sell vaulted pulls from other players. Listings update in real time during sweepstakes events."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {LISTINGS.map((item) => (
          <article
            key={item.id}
            className="card-pack rounded-xl p-4 flex flex-col gap-3 hover:border-fuchsia/30 transition-colors"
          >
            <div className="h-32 overflow-hidden rounded-lg border border-border">
              <AssetImage src={item.card.image} alt={item.card.name} />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">{item.card.name}</h2>
              <p className="text-xs text-muted mt-0.5">Seller: {item.seller}</p>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
              <span className="text-gold font-bold tabular-nums">
                {formatGems(item.card.value)}
              </span>
              <button
                type="button"
                className="text-xs font-bold uppercase text-fuchsia hover:underline"
              >
                Buy Now
              </button>
            </div>
          </article>
        ))}
      </div>
    </UtilityPageShell>
  );
}
