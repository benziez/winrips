import { useEffect, useMemo, useState } from "react";
import type { Pack } from "../../../types";
import type { OddsMode } from "./adjustOdds";
import { ODDS_MODE_OPTIONS } from "./adjustOdds";
import { RipBottomSheet } from "./RipBottomSheet";
import { PackSlabMark } from "./PackSlabMark";
import { CollectibleImage } from "../../ui/CollectibleImage";
import { formatUsd, gemsToUsd } from "../../../constants/retail";
import { formatPackMinUsd, formatPackMaxUsd } from "../../../utils/packValueRange";
import {
  formatTierProbability,
  getPackTierOdds,
  PACK_TIER_BAR_GRADIENT,
} from "../../../utils/packTierOdds";
import { hapticTabSelect } from "../../../utils/mobileHaptics";

interface AdjustOddsSheetProps {
  pack: Pack | null;
  open: boolean;
  onClose: () => void;
  selected?: OddsMode;
  onSelect?: (mode: OddsMode) => void;
  /** Hide the volatility selector + Apply when this is a display-only odds sheet. */
  showVolatility?: boolean;
  /** Probability-weighted expected pull value, preformatted as USD. */
  expectedValueUsd?: string;
  /** Stacking context — must exceed the host view's z-index to render above it. */
  zIndex?: number;
  /** Most valuable pullable card — shown as the hero of the sheet. value is gems. */
  topHit?: { name: string; value: number; image: string };
}

export function AdjustOddsSheet({
  pack,
  open,
  onClose,
  selected = "normal",
  onSelect,
  showVolatility = true,
  expectedValueUsd,
  zIndex,
  topHit,
}: AdjustOddsSheetProps) {
  const [draftMode, setDraftMode] = useState<OddsMode>(selected);

  useEffect(() => {
    if (open) setDraftMode(selected);
  }, [open, selected]);

  const tierRows = useMemo(() => (pack ? getPackTierOdds(pack.id) : []), [pack]);
  const maxProbability = useMemo(
    () => Math.max(...tierRows.map((row) => row.probability), 1),
    [tierRows],
  );

  if (!pack) return null;

  return (
    <RipBottomSheet
      open={open}
      onClose={onClose}
      zIndex={zIndex}
      heightClass="h-[min(92dvh,820px)]"
      showClose={false}
      className="rip-ambient-bg !bg-transparent"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-14">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <PackSlabMark size={48} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[var(--rip-text-muted)]">
                {pack.name}
              </p>
              <h2 className="mt-0.5 text-[26px] font-bold leading-tight text-white">
                Estimated Odds &amp; Values
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              void hapticTabSelect();
              onClose();
            }}
            className="shrink-0 pt-1 text-[15px] font-medium text-[var(--rip-text-muted)]"
          >
            Cancel
          </button>
        </div>

        {topHit ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-[var(--rip-border)] bg-[var(--rip-surface)] px-4 py-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--rip-text-muted)]">
              Top Hit
            </p>
            <div className="mt-3 h-44 w-full">
              <CollectibleImage
                src={topHit.image}
                alt={topHit.name}
                className="mx-auto h-full w-auto object-contain"
                priority
              />
            </div>
            <p className="mt-3 text-center text-[17px] font-semibold text-white">{topHit.name}</p>
            <p className="rip-glow-price-green mt-1 text-[28px] font-bold tabular-nums text-[var(--rip-green-bright)]">
              {formatUsd(gemsToUsd(topHit.value))}
            </p>
          </div>
        ) : null}

        {expectedValueUsd ? (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--rip-border)] bg-[var(--rip-surface)] px-4 py-3.5">
            <span className="text-[15px] font-medium text-[var(--rip-text-muted)]">
              Expected value
            </span>
            <span className="text-[22px] font-bold text-[var(--rip-green-bright)]">
              {expectedValueUsd}
            </span>
          </div>
        ) : null}

        {showVolatility ? (
          <div className="mt-6">
            <p className="mb-3 text-center text-[13px] text-[var(--rip-text-muted)]">
              Choose your volatility level
            </p>
            <div className="flex justify-center gap-2">
              {ODDS_MODE_OPTIONS.map((option) => {
                const isSelected = draftMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      void hapticTabSelect();
                      setDraftMode(option.id);
                    }}
                    className={`rounded-full border px-5 py-2 text-[15px] font-semibold transition-colors ${
                      isSelected
                        ? "border-[var(--rip-border-strong)] bg-[var(--rip-surface-strong)] text-white"
                        : "border-[var(--rip-border)] bg-transparent text-[var(--rip-text-muted)]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="relative mt-8 border-l border-[var(--rip-border)] pl-4">
          {tierRows.map((row) => {
            const widthPct = Math.max(4, (row.probability / maxProbability) * 100);
            const labelInside = widthPct >= 28;
            return (
              <div key={row.tier} className="mb-4 grid grid-cols-[5rem_1fr] items-center gap-3 last:mb-0">
                <div className="text-right">
                  <p className="text-[14px] font-bold text-white">{row.tier}</p>
                  <p className="text-[12px] font-medium text-[var(--rip-text-muted)]">
                    {row.priceRange}
                  </p>
                </div>
                <div className="relative h-8 w-full overflow-hidden rounded-md bg-[var(--rip-surface)]">
                  <div
                    className="absolute inset-y-0 left-0 flex items-center rounded-md px-2"
                    style={{
                      width: `${widthPct}%`,
                      background: PACK_TIER_BAR_GRADIENT[row.tier],
                    }}
                  >
                    {labelInside ? (
                      <span className="ml-auto text-[16px] font-bold text-white">
                        {formatTierProbability(row.probability)}
                      </span>
                    ) : null}
                  </div>
                  {!labelInside ? (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 text-[16px] font-bold text-white"
                      style={{ left: `calc(${widthPct}% + 6px)` }}
                    >
                      {formatTierProbability(row.probability)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-around px-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-medium text-[var(--rip-text-muted)]">Min Value:</span>
            <span className="text-[24px] font-bold text-white">{formatPackMinUsd(pack)}</span>
          </div>
          <div className="h-6 w-px bg-[var(--rip-border)]" aria-hidden />
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-medium text-[var(--rip-text-muted)]">Max Pull:</span>
            <span className="text-[24px] font-bold text-white">{formatPackMaxUsd(pack)}</span>
          </div>
        </div>

        <p className="mt-6 text-[13px] leading-relaxed text-[var(--rip-text-muted)]">
          All collectibles are backed by our buyback guarantee — sell any card back at{" "}
          <strong className="font-bold text-white">85%</strong> of Fair Market Value (FMV). Odds
          are calculated in real time at the time of purchase and subject to change from the above.
        </p>

        <button
          type="button"
          onClick={() => {
            void hapticTabSelect();
            if (showVolatility) onSelect?.(draftMode);
            onClose();
          }}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-[var(--rip-orange)] text-[17px] font-semibold text-white active:scale-[0.97] active:bg-[var(--rip-orange-pressed)]"
        >
          {showVolatility ? "Apply" : "Done"}
        </button>
      </div>
    </RipBottomSheet>
  );
}
