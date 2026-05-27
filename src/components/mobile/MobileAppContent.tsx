import { useApp } from "../../context/AppContext";
import { InfoPageView } from "../views/InfoPageView";
import { PackOpeningView } from "../pack-opening/PackOpeningView";
import { BackPill } from "./BackPill";
import { DismissPill } from "./DismissPill";
import { MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";
import { VaultView } from "../../views/VaultView";
import { LeaderboardView } from "../views/LeaderboardView";
import { RewardsView } from "../views/RewardsView";
import { MobileLobbyView } from "./MobileLobbyView";
import { MobileShowroomView } from "./MobileShowroomView";
import { MobileAccountView } from "./MobileAccountView";
import { MobileCollectionView } from "./MobileCollectionView";
import { MobileSettingsView } from "./MobileSettingsView";
import { MobileReferView } from "./MobileReferView";
import { MobileErrorBoundary } from "./MobileErrorBoundary";
import { isNativeCapacitorApp } from "../../utils/platform";

/** Mobile-only routes — no web hero, sidebar, footer, or live feed. */
export function MobileAppContent() {
  const { currentView, infoPageSlug, closeInfoPage } = useApp();

  if (infoPageSlug) {
    return (
      <MobileErrorBoundary label="Page unavailable">
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-black">
          <BackPill
            onClick={closeInfoPage}
            className="absolute left-6 z-20"
            style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
          />
          <DismissPill
            onClick={closeInfoPage}
            className="absolute right-6 z-20"
            style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
          />
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            style={{
              paddingTop: "calc(max(1rem, env(safe-area-inset-top)) + 3.25rem)",
              paddingBottom: MOBILE_DOCK_CLEARANCE,
            }}
          >
            <InfoPageView pageSlug={infoPageSlug} mobile onBack={closeInfoPage} />
          </div>
        </div>
      </MobileErrorBoundary>
    );
  }

  switch (currentView) {
    case "pack-open":
      return (
        <MobileErrorBoundary label="Pack opening unavailable">
          <PackOpeningView />
        </MobileErrorBoundary>
      );
    case "vault":
    case "inventory":
      if (isNativeCapacitorApp()) {
        return (
          <MobileErrorBoundary label="Collection unavailable">
            <MobileCollectionView />
          </MobileErrorBoundary>
        );
      }
      return (
        <MobileErrorBoundary label="Vault unavailable">
          <div className="flex h-full min-h-0 flex-col overflow-hidden bg-black">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
              <VaultView />
            </div>
          </div>
        </MobileErrorBoundary>
      );
    case "leaderboard":
      return (
        <MobileErrorBoundary label="Leaderboard unavailable">
          <div className="overflow-hidden px-3 pb-4 pt-1">
            <LeaderboardView />
          </div>
        </MobileErrorBoundary>
      );
    case "showroom":
      return (
        <MobileErrorBoundary label="Showroom unavailable">
          <MobileShowroomView />
        </MobileErrorBoundary>
      );
    case "account":
      return (
        <MobileErrorBoundary label="Account unavailable">
          <MobileAccountView />
        </MobileErrorBoundary>
      );
    case "settings":
      return (
        <MobileErrorBoundary label="Settings unavailable">
          <MobileSettingsView />
        </MobileErrorBoundary>
      );
    case "refer":
      return (
        <MobileErrorBoundary label="Refer unavailable">
          <MobileReferView />
        </MobileErrorBoundary>
      );
    case "rewards":
      return (
        <MobileErrorBoundary label="Rewards unavailable">
          <div className="overflow-hidden px-3 pb-4 pt-1">
            <RewardsView />
          </div>
        </MobileErrorBoundary>
      );
    case "lobby":
    default:
      return (
        <MobileErrorBoundary label="Lobby unavailable">
          <MobileLobbyView />
        </MobileErrorBoundary>
      );
  }
}
