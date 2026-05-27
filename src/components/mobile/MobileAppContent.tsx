import { useApp } from "../../context/AppContext";
import { PackOpeningView } from "../pack-opening/PackOpeningView";
import { VaultView } from "../../views/VaultView";
import { LeaderboardView } from "../views/LeaderboardView";
import { RewardsView } from "../views/RewardsView";
import { MobileLobbyView } from "./MobileLobbyView";
import { MobileShowroomView } from "./MobileShowroomView";
import { MobileAccountView } from "./MobileAccountView";
import { MobileErrorBoundary } from "./MobileErrorBoundary";

/** Mobile-only routes — no web hero, sidebar, footer, or live feed. */
export function MobileAppContent() {
  const { currentView } = useApp();

  switch (currentView) {
    case "pack-open":
      return (
        <MobileErrorBoundary label="Pack opening unavailable">
          <PackOpeningView />
        </MobileErrorBoundary>
      );
    case "vault":
    case "inventory":
      return (
        <MobileErrorBoundary label="Vault unavailable">
          <div className="overflow-hidden px-3 pb-4 pt-0">
            <VaultView />
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
