import { useApp } from "../../context/AppContext";
import { PackOpeningView } from "../pack-opening/PackOpeningView";
import { VaultView } from "../../views/VaultView";
import { LeaderboardView } from "../views/LeaderboardView";
import { RewardsView } from "../views/RewardsView";
import { MobileLobbyView } from "./MobileLobbyView";
import { MobileShowroomView } from "./MobileShowroomView";
import { MobileAccountView } from "./MobileAccountView";
import { MobileCollectionView } from "./MobileCollectionView";
import { MobileSettingsView } from "./MobileSettingsView";
import { MobileBattlesView } from "./MobileBattlesView";
import { MobileReferView } from "./MobileReferView";
import { MobileErrorBoundary } from "./MobileErrorBoundary";
import { isNativeCapacitorApp } from "../../utils/platform";
import type { AppView } from "../../types";

const DOCK_TAB_VIEWS: AppView[] = ["lobby", "showroom", "vault", "battles", "account"];

function isDockTabView(view: AppView): boolean {
  return DOCK_TAB_VIEWS.includes(view);
}

function resolveActiveDockView(view: AppView): AppView | null {
  if (view === "pack-open") return "lobby";
  if (isDockTabView(view)) return view;
  return null;
}

function renderDockTab(view: AppView) {
  switch (view) {
    case "lobby":
      return <MobileLobbyView />;
    case "showroom":
      return <MobileShowroomView />;
    case "vault":
      return isNativeCapacitorApp() ? <MobileCollectionView /> : (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-black">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
            <VaultView />
          </div>
        </div>
      );
    case "battles":
      return <MobileBattlesView />;
    case "account":
      return <MobileAccountView />;
    default:
      return <MobileLobbyView />;
  }
}

function renderSecondaryView(view: AppView) {
  switch (view) {
    case "leaderboard":
      return (
        <div className="overflow-hidden px-3 pb-4 pt-1">
          <LeaderboardView />
        </div>
      );
    case "settings":
      return <MobileSettingsView />;
    case "refer":
      return <MobileReferView />;
    case "rewards":
      return (
        <div className="overflow-hidden px-3 pb-4 pt-1">
          <RewardsView />
        </div>
      );
    case "inventory":
      return isNativeCapacitorApp() ? (
        <MobileCollectionView />
      ) : (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-black">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
            <VaultView />
          </div>
        </div>
      );
    default:
      return <MobileLobbyView />;
  }
}

/** Mobile-only routes — no web hero, sidebar, footer, or live feed. */
export function MobileAppContent() {
  const { currentView } = useApp();
  const packOverlayOpen = currentView === "pack-open";
  const activeDockView = resolveActiveDockView(currentView);
  const showSecondaryLayer = !isDockTabView(currentView) && !packOverlayOpen;
  const lobbyIsForeground = activeDockView === "lobby" && !showSecondaryLayer;

  return (
    <>
      <div className="relative h-full min-h-0">
        {/* Packs lobby stays mounted for scroll/state cache; other tabs unmount when inactive. */}
        <div
          className={
            lobbyIsForeground
              ? "relative h-full min-h-0"
              : "pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0"
          }
          aria-hidden={!lobbyIsForeground}
        >
          <MobileErrorBoundary label="lobby unavailable">
            <MobileLobbyView isActive={lobbyIsForeground} />
          </MobileErrorBoundary>
        </div>

        {activeDockView && activeDockView !== "lobby" ? (
          <div className="relative z-10 h-full min-h-0 bg-black">
            <MobileErrorBoundary label={`${activeDockView} unavailable`}>
              {renderDockTab(activeDockView)}
            </MobileErrorBoundary>
          </div>
        ) : null}

        {showSecondaryLayer ? (
          <div className="absolute inset-0 z-20 h-full min-h-0 bg-black">
            <MobileErrorBoundary label={`${currentView} unavailable`}>
              {renderSecondaryView(currentView)}
            </MobileErrorBoundary>
          </div>
        ) : null}
      </div>

      {packOverlayOpen ? (
        <div className="fixed inset-0 z-[101]">
          <MobileErrorBoundary label="Pack opening unavailable">
            <PackOpeningView />
          </MobileErrorBoundary>
        </div>
      ) : null}
    </>
  );
}
