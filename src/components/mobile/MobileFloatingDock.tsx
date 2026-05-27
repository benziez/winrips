import { useApp } from "../../context/AppContext";
import { NavIcon } from "../icons/AppIcons";
import type { NavIconName } from "../icons/AppIcons";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import type { AppView } from "../../types";
import { GlassSurface } from "./GlassSurface";

const TAB_ITEMS: { id: AppView; label: string; icon: NavIconName }[] = [
  { id: "lobby", label: "Packs", icon: "package" },
  { id: "showroom", label: "Showroom", icon: "grid" },
  { id: "vault", label: "Vault", icon: "vault" },
  { id: "account", label: "Account", icon: "users" },
];

/** Space reserved above home indicator + floating dock. */
export const MOBILE_DOCK_CLEARANCE = "calc(6.75rem + env(safe-area-inset-bottom))";

export function MobileFloatingDock() {
  const { currentView, navigateToView } = useApp();

  return (
    <nav
      className="pointer-events-none fixed left-4 right-4 z-50"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-label="Main navigation"
    >
      <GlassSurface
        variant="dock"
        className="pointer-events-auto flex min-h-[68px] items-stretch justify-around rounded-[28px] px-1 py-1.5"
      >
        {TAB_ITEMS.map((item) => {
          const active =
            currentView === item.id ||
            (item.id === "lobby" && currentView === "pack-open");

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                void hapticTabSelect();
                navigateToView(item.id);
              }}
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span
                  className="absolute inset-x-3 top-1 bottom-1 rounded-2xl bg-white/[0.06]"
                  aria-hidden
                />
              ) : null}
              <NavIcon
                name={item.icon}
                size={22}
                className={`relative z-[1] ${active ? "text-[#F2D680]" : "text-[#A1A1AA]"}`}
              />
              <span
                className={`relative z-[1] text-[10px] font-semibold leading-tight ${
                  active ? "text-[#F2D680]" : "text-[#A1A1AA]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </GlassSurface>
    </nav>
  );
}
