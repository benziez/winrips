import { useApp } from "../../context/AppContext";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import { WinRipsLogo } from "../brand/WinRipsLogo";

/** Header logo — tap returns to the Packs lobby and clears any open pack. */
export function MobileHomeLogoButton() {
  const { goToLobby } = useApp();

  return (
    <button
      type="button"
      onClick={() => {
        void hapticTabSelect();
        goToLobby();
      }}
      className="rounded-md active:opacity-70"
      aria-label="Go to Packs"
    >
      <WinRipsLogo className="block h-9 w-auto object-contain" maxWidth={160} glow={false} />
    </button>
  );
}
