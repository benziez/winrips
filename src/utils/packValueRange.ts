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

/** Probability-weighted average pull value (gems). probability is a percent (sums ~100). */
export function getPackExpectedGemValue(packId: string): number {
  const table = getPackDropTable(packId);
  if (table.length === 0) return 0;
  return table.reduce(
    (sum, entry) => sum + entry.card.value * (entry.probability / 100),
    0,
  );
}

export function formatPackExpectedValueUsd(packId: string): string {
  return formatUsd(gemsToUsd(getPackExpectedGemValue(packId)));
}
