/** 10% house edge on upgrade win probability. */
export const UPGRADE_HOUSE_EDGE = 0.9;

/** Max displayed upgrade success rate (90%). */
export const UPGRADE_MAX_WIN_PERCENT = 90;

/**
 * Win probability for the upgrader: (input / target) * 0.9, capped at 90%.
 * Returns a percentage between 0 and 90.
 */
export function computeUpgradeWinPercent(inputValue: number, targetValue: number): number {
  if (!Number.isFinite(inputValue) || !Number.isFinite(targetValue)) return 0;
  if (inputValue <= 0 || targetValue <= 0) return 0;

  const percent = (inputValue / targetValue) * UPGRADE_HOUSE_EDGE * 100;
  return Math.min(percent, UPGRADE_MAX_WIN_PERCENT);
}

export function formatUpgradeWinPercent(inputValue: number, targetValue: number): string {
  if (inputValue <= 0 || targetValue <= 0) {
    return "Select assets to compute upgrade probability.";
  }
  return `${computeUpgradeWinPercent(inputValue, targetValue).toFixed(2)}%`;
}
