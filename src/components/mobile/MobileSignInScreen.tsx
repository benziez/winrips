import { WinRipsLogo } from "../brand/WinRipsLogo";
import { BTN_GHOST_OUTLINE } from "./mobileTheme";

export function MobileSignInScreen({ onBrowsePacks, onSignIn }: MobileSignInScreenProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-[#0a0c10]"
      data-shell="mobile"
    >
      <div
        className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6"
        style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
      >
        <WinRipsLogo className="block h-16 w-auto object-contain" maxWidth={300} glow={false} />
      </div>

      <div
        className="relative shrink-0 space-y-3 overflow-hidden px-6 pt-4"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onBrowsePacks}
          className="w-full rounded-full bg-[#FF007F] py-4 text-center text-[15px] font-bold tracking-wide text-white shadow-[0_0_40px_rgba(255,0,127,0.22)] transition-transform active:scale-[0.98]"
        >
          Browse Packs
        </button>

        <button type="button" onClick={onSignIn} className={`w-full ${BTN_GHOST_OUTLINE}`}>
          Sign In
        </button>
      </div>
    </div>
  );
}

interface MobileSignInScreenProps {
  onBrowsePacks: () => void;
  onSignIn: () => void;
}
