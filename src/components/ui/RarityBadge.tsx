import type { Rarity } from "../../types";

const styles: Record<Rarity, string> = {
  Common: "bg-border text-muted",
  Rare: "bg-border text-fuchsia",
  "Ancient Rare": "bg-border text-gold",
};

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${styles[rarity]}`}
    >
      {rarity}
    </span>
  );
}
