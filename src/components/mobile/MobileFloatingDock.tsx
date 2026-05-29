import { useApp } from "../../context/AppContext";
import {
  AccountIcon,
  CollectionIcon,
  PacksIcon,
  ReferIcon,
  ShowroomIcon,
} from "../icons/AppIcons";
import { hapticTabSelect } from "../../utils/mobileHaptics";
import type { AppView } from "../../types";

const TAB_ITEMS: {
  id: AppView;
  label: string;
  Icon: typeof PacksIcon;
}[] = [
  { id: "lobby", label: "Packs", Icon: PacksIcon },
  { id: "showroom", label: "Showroom", Icon: ShowroomIcon },
  { id: "vault", label: "Collection", Icon: CollectionIcon },
  { id: "refer", label: "Refer Friends", Icon: ReferIcon },
  { id: "account", label: "Account", Icon: AccountIcon },
];

/** Space reserved above home indicator + floating dock. */
export const MOBILE_DOCK_CLEARANCE = "calc(5.5rem + env(safe-area-inset-bottom))";

export function MobileFloatingDock() {
  const { currentView, navigateToView } = useApp();

  return (
    <nav
      className="rip-surface-glass pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t border-[var(--rip-border)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="pointer-events-auto grid h-[68px] grid-cols-5 items-stretch px-1">
        {TAB_ITEMS.map((item) => {
          const active =
            currentView === item.id ||
            (item.id === "lobby" && currentView === "pack-open");
          const { Icon } = item;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                void hapticTabSelect();
                navigateToView(item.id);
              }}
              className="relative flex flex-col items-center justify-center gap-1 px-0.5 py-1"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span
                  className="absolute top-1 h-0.5 w-6 rounded-full bg-white/80"
                  aria-hidden
                />
              ) : null}
              <Icon
                size={24}
                className={active ? "text-white" : "text-[var(--rip-text-subtle)]"}
              />
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
}
