import type { Card } from "../../types";
import {
  ceilingDropHeadline,
  exchangeButtonLabel,
  formatGems,
  SHIP_BUTTON_LABEL,
} from "../../constants/retail";
import { CollectibleImage } from "../ui/CollectibleImage";
import { RarityBadge } from "../ui/RarityBadge";
import { WinParticles } from "./WinParticles";

export interface RevealModalProps {
  card: Card;
  isGuest?: boolean;
  onBurn: () => void;
  onSendToVault: () => void;
  onShip: () => void;
  onClose: () => void;
}

const GUEST_DISABLED_ACTION =
  "cursor-not-allowed opacity-40 pointer-events-none";

const BORDER_BY_RARITY: Record<Card["rarity"], string> = {
  Common: "border-border",
  Rare: "border-fuchsia",
  "Ancient Rare": "border-gold",
};

const GLOW_BY_RARITY: Record<Card["rarity"], string> = {
  Common: "",
  Rare: "shadow-[0_0_40px_rgba(255,0,127,0.25)]",
  "Ancient Rare": "shadow-[0_0_50px_rgba(255,215,0,0.35)]",
};

function isCeilingPull(card: Card): boolean {
  return card.rarity === "Ancient Rare" || card.value >= 10_000;
}

export function RevealModal({
  card,
  isGuest = false,
  onBurn,
  onSendToVault,
  onShip,
  onClose,
}: RevealModalProps) {
  const ceilingPull = isCeilingPull(card);
  const borderClass = BORDER_BY_RARITY[card.rarity];
  const glowClass = ceilingPull ? "mega-win-glow" : GLOW_BY_RARITY[card.rarity];
  const headline = ceilingDropHeadline(card.value);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-[2px] ${ceilingPull ? "animate-screen-shake" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-card-title"
    >
      <div className="relative isolate z-[101] w-full max-w-md overflow-hidden rounded-xl border-2 border-fuchsia/30 bg-[#111115] p-6 shadow-[0_0_30px_rgba(255,0,127,0.2)] sm:p-8">
        {ceilingPull && (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <WinParticles />
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 text-xl text-muted hover:text-white"
          aria-label="Close reveal"
        >
          ×
        </button>

        <header className="relative z-20 mb-6 mt-2 flex flex-col items-center text-center">
          {ceilingPull ? (
            <>
              <p className="reveal-ceiling-headline mb-2 mt-1 w-full">{headline}</p>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia">
                Drop Unlocked!
              </p>
            </>
          ) : (
            <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-fuchsia">
              Drop Unlocked!
            </p>
          )}
        </header>

        <div
          className={`relative z-20 mx-auto mb-5 w-52 overflow-hidden rounded-xl border-2 sm:w-60 ${borderClass} ${glowClass}`}
        >
          <div className="aspect-[2.5/3.5] w-full bg-[#0A0A0C] p-2 sm:p-3">
            <CollectibleImage
              key={`${card.id}-${card.image}`}
              src={card.image}
              alt={card.name}
            />
          </div>
          <div className="flex flex-col items-center gap-1 border-t border-border bg-[#0A0A0C] px-3 py-2.5">
            <RarityBadge rarity={card.rarity} />
          </div>
        </div>

        <h2
          id="reveal-card-title"
          className="relative z-20 mb-1 text-center text-xl font-bold uppercase tracking-tight text-white sm:text-2xl"
        >
          {card.name}
        </h2>
        <p className="relative z-20 mb-6 text-center text-sm text-muted">
          Stated value:{" "}
          <span className="font-bold font-mono text-gold">{formatGems(card.value)}</span>
        </p>

        <div className="relative z-20 flex flex-col gap-3">
          <button
            type="button"
            onClick={onBurn}
            disabled={isGuest}
            className={`w-full rounded-lg bg-[#FF007F] px-3 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white transition-all hover:brightness-110 sm:text-xs ${isGuest ? GUEST_DISABLED_ACTION : ""}`}
          >
            {exchangeButtonLabel(card.value)}
          </button>
          <button
            type="button"
            onClick={onSendToVault}
            disabled={isGuest}
            className={`w-full rounded-lg px-3 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] sm:text-xs ${
              isGuest
                ? "border border-border bg-slate-elevated/60 text-muted"
                : "border border-fuchsia/50 bg-[#1A1C20] text-fuchsia shadow-[0_0_18px_rgba(255,0,127,0.12)] transition-all hover:border-fuchsia hover:bg-fuchsia/10"
            } ${isGuest ? GUEST_DISABLED_ACTION : ""}`}
          >
            {isGuest ? "DEMO SPIN ONLY" : "Send to Vault"}
          </button>
          <button
            type="button"
            onClick={onShip}
            disabled={isGuest}
            className={`w-full rounded-lg bg-[#FFD700] px-3 py-3.5 text-[11px] font-bold uppercase tracking-wide text-black transition-all hover:brightness-105 sm:text-xs ${isGuest ? GUEST_DISABLED_ACTION : ""}`}
          >
            {SHIP_BUTTON_LABEL}
          </button>
        </div>

        <p className="relative z-20 mt-4 text-center text-[9px] uppercase tracking-wider text-muted">
          {isGuest
            ? "Preview pull — create an account to vault, exchange, or ship"
            : "Unopened pulls remain secured in climate-controlled retail vaults"}
        </p>
      </div>
    </div>
  );
}
