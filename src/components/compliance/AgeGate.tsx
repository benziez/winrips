import { useState } from "react";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { isAgeVerified, persistAgeVerified } from "../../constants/ageGate";
import { MOBILE_COLORS } from "../mobile/mobileTheme";

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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0c10] p-4"
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
      <div className="w-full max-w-md px-2">
        <div className="flex justify-center">
          <WinRipsLogo />
        </div>

        <h2
          id="age-gate-title"
          className="mt-8 text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl"
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

        <button
          type="button"
          onClick={handleConfirm}
          className="mt-8 w-full rounded-xl bg-[#FF007F] py-3.5 text-sm font-bold uppercase tracking-wide text-white"
        >
          I am 18 or older
        </button>

        <p
          className="mt-4 text-center text-[11px] font-light leading-relaxed"
          style={{ color: MOBILE_COLORS.textMuted }}
        >
          By entering, you confirm compliance with local laws and our terms of service.
        </p>
      </div>
    </div>
  );
}
