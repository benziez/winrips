// ROADMAP:
// Phase 1 (now): Synthetic 30-day backfill + start writing real daily snapshots
// Phase 2 (after 30 days of real data): Mix real + synthetic, real takes priority
// Phase 3 (after 90 days): Drop synthetic entirely, use real snapshots only
// Eventually: Add per-card price history (separate feature)

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../../../context/AppContext";
import { formatUsd, gemsToUsd } from "../../../constants/retail";
import { writeTodaySnapshotIfMissing } from "../../../lib/portfolioSnapshots";
import {
  filterHistoryByTimeframe,
  generateSyntheticHistory,
  type PortfolioPoint,
  type PortfolioTimeframe,
} from "../../../utils/portfolioHistory";

const TIMEFRAMES: PortfolioTimeframe[] = ["1D", "1W", "1M", "3M", "ALL"];

function formatDeltaUsd(amount: number): string {
  const prefix = amount >= 0 ? "+$" : "-$";
  return `${prefix}${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function PortfolioTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PortfolioPoint }[];
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-[var(--rip-border)] bg-[var(--rip-surface-glass)] p-2 shadow-lg backdrop-blur-md">
      <p className="text-[11px] text-[var(--rip-text-muted)]">{point.date}</p>
      <p className="text-[14px] font-bold text-white">{formatUsd(point.value)}</p>
    </div>
  );
}

export function PortfolioGraph() {
  const { vaultItems, userId } = useApp();
  const [timeframe, setTimeframe] = useState<PortfolioTimeframe>("1M");

  const currentTotal = useMemo(
    () => vaultItems.reduce((sum, item) => sum + gemsToUsd(item.value), 0),
    [vaultItems],
  );

  const fullHistory = useMemo(
    () => generateSyntheticHistory(currentTotal, 30, userId || "anon"),
    [currentTotal, userId],
  );

  const chartData = useMemo(
    () => filterHistoryByTimeframe(fullHistory, timeframe),
    [fullHistory, timeframe],
  );

  const startValue = chartData[0]?.value ?? 0;
  const delta = currentTotal - startValue;
  const deltaPercent = startValue > 0 ? (delta / startValue) * 100 : 0;
  const isPositive = delta >= 0;
  const strokeColor = isPositive ? "var(--rip-green-bright)" : "var(--rip-red-bright)";
  const gradientId = isPositive ? "portfolioGreenFill" : "portfolioRedFill";

  useEffect(() => {
    if (!userId) return;
    void writeTodaySnapshotIfMissing(userId, currentTotal);
  }, [userId, currentTotal, vaultItems.length]);

  return (
    <div className="mx-4 mb-4 rounded-2xl bg-[var(--rip-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--rip-text-muted)]">
            Portfolio Value
          </p>
          <p className="mt-1 text-[32px] font-bold leading-none text-white">
            {formatUsd(currentTotal)}
          </p>
          {currentTotal > 0 && chartData.length > 1 ? (
            <p
              className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold"
              style={{ color: strokeColor }}
            >
              <span aria-hidden>{isPositive ? "▲" : "▼"}</span>
              {formatDeltaUsd(delta)} ({isPositive ? "+" : ""}
              {deltaPercent.toFixed(1)}%)
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          {TIMEFRAMES.map((pill) => {
            const active = timeframe === pill;
            return (
              <button
                key={pill}
                type="button"
                onClick={() => setTimeframe(pill)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-[var(--rip-border-strong)] bg-[var(--rip-surface-strong)] text-white"
                    : "border-transparent text-[var(--rip-text-muted)]"
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-4 h-40">
        {currentTotal === 0 ? (
          <>
            <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-[var(--rip-border-strong)]" />
            <p className="absolute inset-0 flex items-center justify-center text-[13px] text-[var(--rip-text-muted)]">
              Open packs to start tracking
            </p>
          </>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="transparent" />
              <XAxis hide dataKey="date" />
              <YAxis hide domain={["dataMin", "dataMax"]} padding={{ top: 8, bottom: 8 }} />
              <Tooltip content={<PortfolioTooltip />} cursor={{ stroke: "var(--rip-border-strong)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill={`url(#${gradientId})`}
                isAnimationActive
                animationDuration={800}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {currentTotal > 0 ? (
        <p className="mt-2 text-center text-[11px] text-[var(--rip-text-muted)]">
          Tap and hold to inspect
        </p>
      ) : null}
    </div>
  );
}
