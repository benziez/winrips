import type { Rarity } from "../../types";

const styles: Record<Rarity, string> = {
  Common: "bg-slate-elevated/80 text-muted border border-border",
  Rare: "bg-purple/10 text-purple border border-purple/35",
  "Ancient Rare": "bg-gold/10 text-gold border border-gold/40",
};

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] ${styles[rarity]}`}
    >
      {rarity === "Ancient Rare" ? "Grail" : rarity}
    </span>
  );
}
