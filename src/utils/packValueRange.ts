import type { Pack } from "../types";
import { formatUsd, gemsToUsd } from "../constants/retail";
import { getPackDropTable } from "../data/packDropTables";

export function getPackGemValueRange(packId: string): { minGems: number; maxGems: number } | null {
  const table = getPackDropTable(packId);
  if (table.length === 0) return null;

  let minGems = table[0]!.card.value;
  let maxGems = table[0]!.card.value;
  for (const entry of table) {
    minGems = Math.min(minGems, entry.card.value);
    maxGems = Math.max(maxGems, entry.card.value);
  }
  return { minGems, maxGems };
}

export function formatPackMinUsd(pack: Pack): string {
  const range = getPackGemValueRange(pack.id);
  if (!range) return formatUsd(0);
  return formatUsd(gemsToUsd(range.minGems));
}

export function formatPackMaxUsd(pack: Pack): string {
  const range = getPackGemValueRange(pack.id);
  if (!range) return formatUsd(0);
  return formatUsd(gemsToUsd(range.maxGems));
}
