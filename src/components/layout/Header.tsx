import { useApp } from "../../context/AppContext";
import { TokenBalanceWidget } from "../wallet/TokenBalanceWidget";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { RETAIL_COPY } from "../../constants/retail";
import { useNavDrawer } from "./Sidebar";

function MenuToggleIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-4 w-5 flex-col justify-between" aria-hidden>
      <span
        className={`block h-0.5 w-full rounded-full bg-current transition-all duration-300 ${
          open ? "translate-y-[7px] rotate-45" : ""
        }`}
      />
      <span
        className={`block h-0.5 w-full rounded-full bg-current transition-all duration-300 ${
          open ? "scale-x-0 opacity-0" : ""
        }`}
      />
      <span
        className={`block h-0.5 w-full rounded-full bg-current transition-all duration-300 ${
          open ? "-translate-y-[7px] -rotate-45" : ""
        }`}
      />
    </span>
  );
}

export function Header() {
  const { openAuthModal } = useApp();
  const { isMenuOpen, toggleMenu } = useNavDrawer();

  return (
    <header className="sticky top-0 z-30 bg-obsidian/95 backdrop-blur-md border-b border-border h-16">
      <div className="mx-auto grid h-full w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5 px-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 justify-self-start bg-transparent">
          <button
            type="button"
            onClick={toggleMenu}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border p-2 transition-colors lg:hidden ${
              isMenuOpen
                ? "border-fuchsia/40 bg-fuchsia/10 text-fuchsia"
                : "border-transparent text-muted hover:text-white hover:bg-metallic"
            }`}
            aria-label={isMenuOpen ? "Close platform menu" : "Open platform menu"}
            aria-expanded={isMenuOpen}
          >
            <MenuToggleIcon open={isMenuOpen} />
          </button>
          <div className="flex min-w-0 max-w-[42vw] flex-col bg-transparent sm:max-w-none">
            <WinRipsLogo variant="nav" />
            <span className="mt-0.5 hidden text-[9px] uppercase tracking-widest text-muted md:inline-block">
              {RETAIL_COPY.tagline}
            </span>
          </div>
        </div>

        <div className="min-w-0 shrink justify-self-center">
          <TokenBalanceWidget />
        </div>

        <div className="flex items-center gap-1.5 justify-self-end sm:gap-2">
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="hidden sm:inline-flex px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white rounded-lg border border-border bg-transparent hover:border-fuchsia/50 hover:text-fuchsia transition-colors"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => openAuthModal("signup")}
            className="shrink-0 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white rounded-lg bg-[#FF007F] hover:brightness-110 transition-all shadow-[0_0_12px_rgba(255,0,127,0.35)] sm:px-4 sm:py-2 sm:text-xs"
          >
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Create Account</span>
          </button>
        </div>
      </div>
    </header>
  );
}
