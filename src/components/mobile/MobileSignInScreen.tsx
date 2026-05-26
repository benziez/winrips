import { useState } from "react";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { useApp } from "../../context/AppContext";
import { AppleSignInButton } from "../auth/AppleSignInButton";
import { BTN_GHOST_OUTLINE } from "./mobileTheme";

interface MobileSignInScreenProps {
  onGuestContinue: () => void;
}

export function MobileSignInScreen({ onGuestContinue }: MobileSignInScreenProps) {
  const { showCashoutToast } = useApp();
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-black"
      data-shell="mobile"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 15%, rgba(212, 175, 55, 0.12), transparent 55%)",
        }}
        aria-hidden
      />

      <div
        className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6"
        style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
      >
        <div className="mb-10 scale-95">
          <WinRipsLogo />
        </div>

        <div className="w-full max-w-sm space-y-3">
          <AppleSignInButton
            onError={(message) => setFormError(message)}
            onSuccess={() => showCashoutToast("Welcome to WinRips!")}
          />

          {formError ? (
            <p className="text-center text-xs text-red-400" role="alert">
              {formError}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="shrink-0 overflow-hidden px-6 pt-4"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <button type="button" onClick={onGuestContinue} className={`w-full ${BTN_GHOST_OUTLINE}`}>
          Browse Drops
        </button>
      </div>
    </div>
  );
}
