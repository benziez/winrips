import { useApp } from "../../context/AppContext";
import { NavIcon } from "../icons/AppIcons";
import type { NavIconName } from "../icons/AppIcons";
import { isAppStoreCommerce } from "../../constants/commerce";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import type { AppView } from "../../types";
import { GlassSurface } from "./GlassSurface";
import { OBSIDIAN_GOLD } from "./mobileTheme";

const STORE_TAB_ITEMS: { id: AppView; label: string; icon: NavIconName }[] = [
  { id: "lobby", label: "Drops", icon: "package" },
  { id: "vault", label: "Vault", icon: "vault" },
];

const FULL_TAB_ITEMS: { id: AppView; label: string; icon: NavIconName }[] = [
  ...STORE_TAB_ITEMS,
  { id: "leaderboard", label: "Ranks", icon: "trophy" },
  { id: "rewards", label: "Rewards", icon: "gift" },
];

/** Space reserved above home indicator + floating dock. */
export const MOBILE_DOCK_CLEARANCE = "calc(5.5rem + env(safe-area-inset-bottom))";

export function MobileFloatingDock() {
  const { currentView, navigateToView } = useApp();
  const tabItems = isAppStoreCommerce() ? STORE_TAB_ITEMS : FULL_TAB_ITEMS;

  return (
    <nav
      className="pointer-events-none fixed left-6 right-6 z-50"
      style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Main navigation"
    >
      <GlassSurface
        variant="dock"
        className="pointer-events-auto flex h-[56px] items-center justify-around rounded-[32px] px-3"
      >
        {tabItems.map((item) => {
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
              className="relative flex min-w-0 flex-1 items-center justify-center py-2"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span
                  className="absolute inset-x-2 bottom-1 h-0.5 rounded-full"
                  style={{ backgroundColor: OBSIDIAN_GOLD.bright }}
                  aria-hidden
                />
              ) : null}
              <NavIcon
                name={item.icon}
                size={24}
                className={`relative z-[1] ${active ? "text-[#F2D680]" : "text-[#A1A1AA]"}`}
              />
            </button>
          );
        })}
      </GlassSurface>
    </nav>
  );
}
