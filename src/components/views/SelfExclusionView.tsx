import { useState } from "react";
import { UtilityPageShell } from "./UtilityPageShell";
import { useApp } from "../../context/AppContext";

const DURATIONS = ["24 hours", "7 days", "30 days", "6 months", "Permanent"];

export function SelfExclusionView() {
  const { showCashoutToast } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <UtilityPageShell
      eyebrow="Responsible Play"
      title="Self-Exclusion"
      description="Take a break from pack opening and sweeps participation. Exclusions cannot be reversed early once confirmed."
    >
      <div className="max-w-lg card-pack rounded-xl p-5 sm:p-6 space-y-4">
        <p className="text-sm text-muted leading-relaxed">
          Select a cooldown period. Your account will be locked from ripping packs and purchasing
          bundles until the timer expires.
        </p>
        <ul className="space-y-2">
          {DURATIONS.map((duration) => (
            <li key={duration}>
              <button
                type="button"
                onClick={() => setSelected(duration)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  selected === duration
                    ? "border-fuchsia bg-fuchsia/10 text-fuchsia"
                    : "border-border text-muted hover:text-white hover:border-border"
                }`}
              >
                {duration}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={!selected}
          onClick={() =>
            showCashoutToast(`Self-exclusion set for ${selected} (demo — not enforced)`)
          }
          className="w-full rounded-xl border border-border bg-metallic py-3 text-sm font-bold uppercase tracking-wide text-white hover:border-fuchsia/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Exclusion
        </button>
      </div>
    </UtilityPageShell>
  );
}
