import { useState } from "react";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { isAgeVerified, persistAgeVerified } from "../../constants/ageGate";
import { BRAND_FUCHSIA, BRAND_GOLD, BRAND_GRADIENT } from "../../constants/theme";

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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-obsidian/95 p-4 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(255,0,122,0.12),transparent_55%),radial-gradient(ellipse_at_50%_72%,rgba(224,176,52,0.08),transparent_50%)]"
        aria-hidden
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-slate/90 p-8 shadow-[0_0_80px_rgba(0,0,0,0.55),0_0_40px_rgba(255,0,122,0.08)] sm:p-10">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
          aria-hidden
        />

        <div className="flex justify-center">
          <WinRipsLogo />
        </div>

        <p
          className="mt-5 text-center text-[10px] font-bold uppercase tracking-[0.28em]"
          style={{ color: BRAND_GOLD }}
        >
          Restricted Access
        </p>
        <h2
          id="age-gate-title"
          className="mt-2 text-center text-2xl font-black uppercase tracking-[0.1em] text-white sm:text-3xl"
        >
          Age Verification
        </h2>
        <p className="mx-auto mt-4 max-w-xs text-center text-sm leading-relaxed text-muted">
          You must be{" "}
          <span className="font-semibold text-white">18 years of age or older</span> to enter
          WinRips.
        </p>

        <button
          type="button"
          onClick={handleConfirm}
          className="mt-8 w-full rounded-xl px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition-all hover:brightness-110"
          style={{
            background: BRAND_GRADIENT,
            border: `1px solid color-mix(in srgb, ${BRAND_GOLD} 35%, transparent)`,
            boxShadow: `0 0 28px color-mix(in srgb, ${BRAND_FUCHSIA} 35%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
          }}
        >
          I am 18 or older
        </button>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-muted/80">
          By entering, you confirm compliance with local laws and our terms of service.
        </p>
      </div>
    </div>
  );
}
