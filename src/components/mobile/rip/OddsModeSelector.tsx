import { ODDS_MODE_OPTIONS, oddsModeDisclaimer, type OddsMode } from "./adjustOdds";
import { hapticTabSelect } from "../../../utils/mobileHaptics";

interface OddsModeSelectorProps {
  mode: OddsMode;
  onChange: (mode: OddsMode) => void;
  /** Slightly larger tap targets on the pack detail screen. */
  size?: "default" | "compact";
}

export function OddsModeSelector({ mode, onChange, size = "default" }: OddsModeSelectorProps) {
  const isCompact = size === "compact";
  const disclaimer = oddsModeDisclaimer(mode);
  const isRiskyActive = mode === "risky_rip";

  return (
    <div>
      <div className="flex gap-2">
        {ODDS_MODE_OPTIONS.map((option) => {
          const active = mode === option.id;
          const isRisky = option.id === "risky_rip";
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                void hapticTabSelect();
                onChange(option.id);
              }}
              className={[
                "flex-1 rounded-full font-bold transition-colors",
                isCompact ? "py-2.5 text-[15px] font-semibold border" : "h-11 text-[15px]",
                active
                  ? isRisky
                    ? "risky-rip-toggle-active border-transparent text-white"
                    : isCompact
                      ? "border-[var(--rip-border-strong)] bg-[var(--rip-surface-strong)] text-white"
                      : "bg-[var(--rip-surface-strong)] text-white ring-1 ring-[var(--rip-border-strong)]"
                  : isCompact
                    ? "border-[var(--rip-border)] bg-transparent text-[var(--rip-text-muted)]"
                    : "bg-[var(--rip-surface)] text-[var(--rip-text-muted)]",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p
        className={`mt-2 text-center leading-relaxed ${
          isCompact ? "text-[13px]" : "text-[12px]"
        } ${isRiskyActive ? "text-[#ff8fa3]" : "text-[var(--rip-text-muted)]"}`}
      >
        {disclaimer}
      </p>
    </div>
  );
}
