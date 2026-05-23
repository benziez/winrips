/** Limited-time deposit value prop — Wallet + Gem Refill checkout. */
export function WalletOfferBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-fuchsia/25 bg-gradient-to-r from-fuchsia/10 via-[#1a1d24] to-gold/10 ${
        compact ? "px-3 py-1.5 lg:px-4 lg:py-3" : "px-4 py-3"
      }`}
    >
      <p className="text-center text-xs font-semibold leading-relaxed text-white sm:text-left">
        <span className="text-fuchsia" aria-hidden>
          ✨{" "}
        </span>
        <span className="text-white/95">Limited Time Offer:</span>{" "}
        <span className="text-muted">
          Get a <span className="font-bold text-fuchsia">100% match on Rips</span> with every
          single deposit!
        </span>
      </p>
    </div>
  );
}
