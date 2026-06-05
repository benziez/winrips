import { memo } from "react";
import { Swords } from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  AccountIcon,
  CollectionIcon,
  PacksIcon,
  TrophyIcon,
} from "../icons/AppIcons";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import type { AppView } from "../../types";

const TAB_ITEMS: {
  id: AppView;
  label: string;
  Icon?: typeof PacksIcon;
  lucideIcon?: typeof Swords;
}[] = [
  { id: "lobby", label: "Packs", Icon: PacksIcon },
  { id: "showroom", label: "Wins", Icon: TrophyIcon },
  { id: "vault", label: "Collection", Icon: CollectionIcon },
  { id: "battles", label: "Battles", lucideIcon: Swords },
  { id: "account", label: "Account", Icon: AccountIcon },
];

/** Space reserved above home indicator + floating dock (matches h-[68px] tab row). */
export const MOBILE_DOCK_CLEARANCE = "calc(68px + env(safe-area-inset-bottom))";

export const MobileFloatingDock = memo(function MobileFloatingDock() {
  const { currentView, navigateToView } = useApp();

  return (
    <nav
      className="rip-surface-glass pointer-events-none fixed inset-x-0 bottom-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="pointer-events-auto grid h-[68px] grid-cols-5 items-stretch px-1">
        {TAB_ITEMS.map((item) => {
          const active =
            currentView === item.id ||
            (item.id === "lobby" && currentView === "pack-open");
          const { Icon, lucideIcon: LucideIcon } = item;
          const iconClass = active ? "text-white" : "text-[var(--rip-text-subtle)]";

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                void hapticTabSelect();
                navigateToView(item.id);
              }}
              className="relative flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-1"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span
                  className="absolute top-1 h-0.5 w-6 rounded-full bg-white/80"
                  aria-hidden
                />
              ) : null}
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                {LucideIcon ? (
                  <LucideIcon
                    size={22}
                    strokeWidth={1.75}
                    className={iconClass}
                    aria-hidden
                  />
                ) : Icon ? (
                  <Icon size={24} className={iconClass} />
                ) : null}
              </span>
              <span
                className={`max-w-full truncate text-[11px] font-medium leading-tight ${
                  active ? "text-white" : "text-[var(--rip-text-subtle)]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
