import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

  useEffect(() => {
    if (!isMenuOpen) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    if (!mq.matches) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMenuOpen]);

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
      className={`fixed inset-y-0 left-0 z-30 hidden h-screen shrink-0 flex-col border-r border-border bg-obsidian transition-[width] duration-300 ease-out lg:z-40 lg:flex ${
        isMenuOpen ? "w-60" : "w-16"
      }`}
    >
      <div
        className={`flex shrink-0 items-center border-b border-border ${
          isMenuOpen ? "justify-end px-4 py-3" : "justify-center px-0 py-3"
        }`}
      >
        <button
          type="button"
          onClick={toggleMenu}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
            isMenuOpen
              ? "border-fuchsia/35 bg-fuchsia/10 text-fuchsia"
              : "border-border bg-slate text-muted hover:bg-slate-elevated hover:text-white"
          }`}
          aria-label={isMenuOpen ? "Collapse navigation" : "Expand navigation"}
          aria-expanded={isMenuOpen}
        >
          <MenuToggleIcon open={isMenuOpen} />
        </button>
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto ${
          isMenuOpen ? "px-2 py-3" : "items-center px-1 py-2"
        }`}
      >
        <SidebarNav expanded={isMenuOpen} />
        <SidebarHubNav expanded={isMenuOpen} />
      </div>

      <SocialFooter expanded={isMenuOpen} />
    </aside>
  );
}
