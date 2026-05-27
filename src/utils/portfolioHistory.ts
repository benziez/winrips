export interface PortfolioPoint {
  date: string;
  value: number;
  isSynthetic: boolean;
}

function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function generateSyntheticHistory(
  currentTotal: number,
  days = 30,
  seed = "default",
): PortfolioPoint[] {
  const safeTotal = Number.isFinite(currentTotal) && currentTotal >= 0 ? currentTotal : 0;
  const rng = mulberry32(hashSeed(seed));
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const floor = safeTotal * 0.6;
  const ceiling = safeTotal * 1.1;
  const values: number[] = new Array(days + 1).fill(safeTotal);
  values[days] = safeTotal;

  for (let i = days - 1; i >= 0; i -= 1) {
    const next = values[i + 1]!;
    const change = (rng() * 0.07 - 0.03) * next;
    let value = next - change;
    value = Math.max(floor, Math.min(ceiling, value));
    values[i] = value;
  }

  const points: PortfolioPoint[] = [];
  for (let i = 0; i <= days; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - i));
    points.push({
      date: toIsoDate(date),
      value: i === days ? safeTotal : Number(values[i]!.toFixed(2)),
      isSynthetic: i !== days,
    });
  }

  return points;
}

export function mergeWithRealHistory(
  synthetic: PortfolioPoint[],
  realSnapshots: PortfolioPoint[],
): PortfolioPoint[] {
  if (realSnapshots.length === 0) return synthetic;

  const realByDate = new Map(realSnapshots.map((point) => [point.date, point]));
  const merged = synthetic.map((point) => realByDate.get(point.date) ?? point);

  for (const real of realSnapshots) {
    if (!merged.some((point) => point.date === real.date)) {
      merged.push(real);
    }
  }

  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

export type PortfolioTimeframe = "1D" | "1W" | "1M" | "3M" | "ALL";

export function filterHistoryByTimeframe(
  history: PortfolioPoint[],
  timeframe: PortfolioTimeframe,
): PortfolioPoint[] {
  if (history.length === 0) return history;

  const dayMap: Record<PortfolioTimeframe, number> = {
    "1D": 1,
    "1W": 7,
    "1M": 30,
    "3M": 90,
    ALL: history.length,
  };

  const keepDays = dayMap[timeframe];
  if (keepDays >= history.length) return history;
  return history.slice(history.length - keepDays - 1);
}
