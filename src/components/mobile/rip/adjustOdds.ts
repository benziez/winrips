export type OddsMode = "normal" | "better" | "best";

export const ODDS_MODE_OPTIONS: {
  id: OddsMode;
  label: string;
  subtitle: string;
  multiplier: number;
}[] = [
  { id: "normal", label: "Normal", subtitle: "1× price, default odds", multiplier: 1 },
  { id: "better", label: "Better", subtitle: "2× price, improved rare chance", multiplier: 2 },
  { id: "best", label: "Best", subtitle: "5× price, maximum rare chance", multiplier: 5 },
];

export function oddsMultiplierForMode(mode: OddsMode): number {
  return ODDS_MODE_OPTIONS.find((o) => o.id === mode)?.multiplier ?? 1;
}
