import { useApp } from "../../context/AppContext";
import { LiveWinsTicker } from "../dashboard/LiveWinsTicker";
import { HeaderWalletControls } from "../wallet/HeaderWalletControls";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { HeaderProfileMenu } from "./HeaderProfileMenu";
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
  const { openAuthModal, isLoggedIn } = useApp();
  const { isMenuOpen, toggleMenu } = useNavDrawer();

  return (
    <header className="sticky top-0 z-50 w-full min-w-0 border-b border-border bg-obsidian/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between gap-2 px-3 sm:h-16 sm:px-4 lg:grid lg:h-16 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-3 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden bg-transparent sm:gap-3 lg:flex-none lg:justify-self-start">
          <button
            type="button"
            onClick={toggleMenu}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border p-2 transition-all duration-200 lg:hidden ${
              isMenuOpen
                ? "border-fuchsia/35 bg-fuchsia/10 text-fuchsia"
                : "border-border bg-slate text-muted hover:bg-slate-elevated hover:text-white"
            }`}
            aria-label={isMenuOpen ? "Close platform menu" : "Open platform menu"}
            aria-expanded={isMenuOpen}
          >
            <MenuToggleIcon open={isMenuOpen} />
          </button>
          <div className="flex shrink-0 items-center bg-transparent ml-2 sm:ml-3 lg:ml-0 lg:pl-4">
            <WinRipsLogo />
          </div>
        </div>

        {isLoggedIn ? (
          <div className="hidden min-w-0 justify-center lg:flex lg:justify-self-center">
            <HeaderWalletControls />
          </div>
        ) : null}

        <div className="flex shrink-0 items-center justify-end lg:justify-self-end">
          {isLoggedIn ? (
            <nav
              className="flex items-center gap-1 sm:gap-1.5 lg:hidden"
              aria-label="Account controls"
            >
              <HeaderWalletControls compact />
              <HeaderProfileMenu />
            </nav>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="rounded-md border border-border bg-transparent px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted transition-colors duration-200 hover:border-border hover:bg-slate hover:text-white sm:px-3 sm:text-xs"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => openAuthModal("signup")}
                className="rounded-md bg-[#ff007a] px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-all duration-200 hover:brightness-110 sm:px-3 sm:text-xs"
              >
                Register
              </button>
            </div>
          )}

          {isLoggedIn ? (
            <div className="hidden lg:block">
              <HeaderProfileMenu />
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden w-full lg:flex">
        <LiveWinsTicker embedded />
      </div>
    </header>
  );
}
