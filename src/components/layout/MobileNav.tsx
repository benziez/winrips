import type { NavIconName } from "../icons/AppIcons";
import { NavIcon } from "../icons/AppIcons";
import type { AppView } from "../../types";
import { useApp } from "../../context/AppContext";

const ITEMS: { id: AppView; label: string; icon: NavIconName }[] = [
  { id: "lobby", label: "Drops", icon: "package" },
  { id: "vault", label: "Vault", icon: "vault" },
  { id: "leaderboard", label: "Ranks", icon: "trophy" },
  { id: "rewards", label: "Rewards", icon: "gift" },
];

export function MobileNav() {
  const { currentView, navigateToView } = useApp();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-slate lg:hidden">
      <div className="flex items-center justify-around px-1 py-1.5">
        {ITEMS.map((item) => {
          const active =
            currentView === item.id ||
            (item.id === "lobby" && currentView === "pack-open");
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateToView(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                active ? "text-fuchsia" : "text-muted hover:text-white"
              }`}
            >
              <NavIcon name={item.icon} size={18} />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
