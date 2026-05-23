import type { Currency } from "../../types";

export function CurrencyTokenIcon({
  currency,
  size = 20,
  className = "",
}: {
  currency: Currency;
  size?: number;
  className?: string;
}) {
  const isGems = currency === "gold-volts";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-black leading-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden
    >
      {isGems ? (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-gold via-[#f5d76e] to-[#c9a227] text-[#1a1200] shadow-[0_0_10px_rgba(224,176,52,0.35)]">
          G
        </span>
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-fuchsia to-[#c4006a] text-white shadow-[0_0_10px_rgba(255,0,122,0.35)]">
          R
        </span>
      )}
    </span>
  );
}
