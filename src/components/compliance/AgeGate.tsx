import { useState } from "react";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { isAgeVerified, persistAgeVerified } from "../../constants/ageGate";
import { GlassSurface } from "../mobile/GlassSurface";
import { BTN_PRIMARY, MOBILE_COLORS, OBSIDIAN_GOLD } from "../mobile/mobileTheme";

export function AgeGate() {
  const [verified, setVerified] = useState(() => isAgeVerified());

  if (verified) {
    return null;
  }

  function handleConfirm() {
    persistAgeVerified();
    setVerified(true);
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black p-4"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_32%,rgba(212,175,55,0.14),transparent_55%)]"
        aria-hidden
      />

      <GlassSurface
        variant="default"
        className="relative w-full max-w-md overflow-hidden rounded-2xl p-8 sm:p-10"
      >
        <div className="flex justify-center">
          <WinRipsLogo />
        </div>

        <p
          className="mt-5 text-center text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color: OBSIDIAN_GOLD.bright }}
        >
          Restricted Access
        </p>
        <h2
          id="age-gate-title"
          className="mt-2 text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          Age Verification
        </h2>
        <p
          className="mx-auto mt-4 max-w-xs text-center text-sm font-light leading-relaxed"
          style={{ color: MOBILE_COLORS.textMuted }}
        >
          You must be{" "}
          <span className="font-semibold text-white">18 years of age or older</span> to enter
          WinRips.
        </p>

        <button type="button" onClick={handleConfirm} className={`mt-8 ${BTN_PRIMARY}`}>
          I am 18 or older
        </button>

        <p
          className="mt-4 text-center text-[11px] font-light leading-relaxed"
          style={{ color: MOBILE_COLORS.textMuted }}
        >
          By entering, you confirm compliance with local laws and our terms of service.
        </p>
      </GlassSurface>
    </div>
  );
}
