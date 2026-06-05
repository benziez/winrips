import { useEffect, useState } from "react";
import { isManualRipEnabled, setManualRipEnabled } from "../../lib/mobileRipPreferences";
import { GlassSurface } from "./GlassSurface";
import { MOBILE_COLORS, OBSIDIAN_GOLD } from "./mobileTheme";

/** Account — toggle manual rip gesture vs 8s auto sequence. */
export function MobileRipSettingsToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isManualRipEnabled());
  }, []);

  return (
    <GlassSurface variant="solid" className="rounded-2xl p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Enable Manual Rip</h2>
          <p className="mt-1 text-xs" style={{ color: MOBILE_COLORS.textMuted }}>
            Drag down on the pack to tear. Off uses the 8-second auto sequence.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            setManualRipEnabled(next);
          }}
          className="relative h-8 w-14 shrink-0 rounded-full border border-white/10 transition-colors"
          style={{ backgroundColor: enabled ? OBSIDIAN_GOLD.base : "rgba(255,255,255,0.08)" }}
        >
          <span
            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>
    </GlassSurface>
  );
}
