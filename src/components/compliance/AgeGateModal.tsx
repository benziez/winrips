import { useState } from "react";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { isAgeVerified, persistAgeVerified } from "../../constants/ageGate";
import { useAuth } from "../../context/AuthContext";

const EXIT_URL = "https://www.google.com";

export function AgeGateModal() {
  const { user, authLoading } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (authLoading || user !== null || isAgeVerified() || dismissed) {
    return null;
  }

  function handleVerify() {
    persistAgeVerified();
    setDismissed(true);
  }

  function handleExit() {
    window.location.href = EXIT_URL;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111115]/95 p-8 shadow-[0_0_60px_rgba(0,0,0,0.65)] sm:p-10">
        <div className="flex justify-center">
          <div className="flex justify-center bg-transparent">
            <WinRipsLogo />
          </div>
        </div>
        <h2
          id="age-gate-title"
          className="mt-4 text-center text-2xl font-black uppercase tracking-[0.12em] text-white sm:text-3xl"
        >
          AGE VERIFICATION
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-center text-sm leading-relaxed text-[#a0a5b5]">
          You must be <span className="font-semibold text-white">18 years of age or older</span> to
          enter. By continuing, you agree to our{" "}
          <a
            href="/terms"
            className="font-semibold text-fuchsia underline decoration-fuchsia/40 underline-offset-2 hover:text-white"
          >
            terms of use
          </a>
          .
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleVerify}
            className="flex-1 rounded-xl bg-[#FF007F] px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:brightness-110"
          >
            I am 18 or older
          </button>
          <button
            type="button"
            onClick={handleExit}
            className="flex-1 rounded-xl border border-[#2A2D34] bg-[#1A1C20] px-5 py-3.5 text-sm font-semibold uppercase tracking-wider text-[#a0a5b5] hover:text-white"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
