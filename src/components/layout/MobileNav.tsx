import type { AppView } from "../../types";
import { useApp } from "../../context/AppContext";

const ITEMS: { id: AppView; label: string; icon: string }[] = [
  { id: "lobby", label: "Drops", icon: "📦" },
  { id: "vault", label: "Vault", icon: "🎒" },
  { id: "leaderboard", label: "Ranks", icon: "🏆" },
  { id: "rewards", label: "Rewards", icon: "🎁" },
];

export function MobileNav() {
  const { currentView, navigateToView } = useApp();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate border-t border-border">
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
                active ? "text-fuchsia" : "text-muted hover:text-fuchsia"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
