import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { WinRipsLogo } from "../brand/WinRipsLogo";
import { SidebarHubNav } from "../NavigationDrawer";
import { SidebarNav } from "./SidebarNav";
import { SocialFooter } from "./SocialFooter";

interface NavDrawerContextValue {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
  closeMenu: () => void;
}

const NavDrawerContext = createContext<NavDrawerContextValue | null>(null);

export function NavDrawerProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /** Closes the mobile overlay drawer; does not collapse the desktop sidebar rail. */
  const closeMenu = useCallback(() => {
    if (typeof window === "undefined") {
      setIsMenuOpen(false);
      return;
    }
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setIsMenuOpen(false);
    }
  }, []);
  const toggleMenu = useCallback(() => setIsMenuOpen((open) => !open), []);

  const value = useMemo(
    () => ({
      isMenuOpen,
      setIsMenuOpen,
      toggleMenu,
      closeMenu,
    }),
    [isMenuOpen, closeMenu, toggleMenu],
  );

  return (
    <NavDrawerContext.Provider value={value}>{children}</NavDrawerContext.Provider>
  );
}

export function useNavDrawer() {
  const ctx = useContext(NavDrawerContext);
  if (!ctx) {
    throw new Error("useNavDrawer must be used within NavDrawerProvider");
  }
  return ctx;
}

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

export function Sidebar() {
  const { isMenuOpen, toggleMenu } = useNavDrawer();

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-neutral-800 bg-[#111115] transition-[width] duration-300 ease-out lg:sticky lg:top-0 lg:flex lg:h-screen lg:max-h-screen lg:overflow-hidden ${
        isMenuOpen ? "w-64" : "w-20"
      }`}
    >
      <div
        className={`flex shrink-0 items-center border-b border-border ${
          isMenuOpen ? "justify-between gap-2 px-4 py-4" : "justify-center px-2 py-4"
        }`}
      >
        <div className={`min-w-0 bg-transparent transition-opacity duration-300 ${isMenuOpen ? "" : "hidden"}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Collectibles
          </p>
          <WinRipsLogo variant="sidebar" className="mt-1" />
        </div>
        <button
          type="button"
          onClick={toggleMenu}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            isMenuOpen
              ? "border-fuchsia/40 bg-fuchsia/10 text-fuchsia"
              : "border-border bg-metallic text-muted hover:border-fuchsia/30 hover:text-white"
          }`}
          aria-label={isMenuOpen ? "Collapse navigation" : "Expand navigation"}
          aria-expanded={isMenuOpen}
        >
          <MenuToggleIcon open={isMenuOpen} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2">
        <SidebarNav expanded={isMenuOpen} />
        <SidebarHubNav expanded={isMenuOpen} />
      </div>

      <SocialFooter expanded={isMenuOpen} />
    </aside>
  );
}
