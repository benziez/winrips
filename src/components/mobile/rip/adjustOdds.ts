import type { OddsMode } from "../../../utils/riskyRipOdds";

export type { OddsMode } from "../../../utils/riskyRipOdds";

export const ODDS_MODE_OPTIONS: {
  id: OddsMode;
  label: string;
}[] = [
  { id: "normal", label: "Normal" },
  { id: "risky_rip", label: "Risky Rip" },
];

export const NORMAL_ODDS_DISCLAIMER =
  "Standard odds. Balanced mix of commons, rares, and chase cards.";

export const RISKY_RIP_DISCLAIMER =
  "High variance mode. Commons dominate, but Legendary and Mythic odds are boosted. Swing for the fences — every pull still wins a real card.";

export function oddsModeDisclaimer(mode: OddsMode): string {
  return mode === "risky_rip" ? RISKY_RIP_DISCLAIMER : NORMAL_ODDS_DISCLAIMER;
}

export function isRiskyRipOddsMode(mode: OddsMode): boolean {
  return mode === "risky_rip";
}
