import { useApp } from "../../context/AppContext";
import { DashboardView } from "../dashboard/DashboardView";
import { PackOpeningView } from "../pack-opening/PackOpeningView";
import { VaultView } from "../../views/VaultView";
import { UpgraderView } from "../../views/UpgraderView";
import { BattlesView } from "../../views/BattlesView";
import { LeaderboardView } from "./LeaderboardView";
import { RewardsView } from "./RewardsView";
import { MarketplaceView } from "./MarketplaceView";
import { FairnessView } from "./FairnessView";
import { HelpDeskView } from "./HelpDeskView";
import { SelfExclusionView } from "./SelfExclusionView";

export function ViewRouter() {
  const { currentView } = useApp();

  switch (currentView) {
    case "lobby":
      return <DashboardView />;
    case "pack-open":
      return <PackOpeningView />;
    case "inventory":
    case "vault":
      return <VaultView />;
    case "upgrader":
      return <UpgraderView />;
    case "battles":
      return <BattlesView />;
    case "leaderboard":
      return <LeaderboardView />;
    case "rewards":
      return <RewardsView />;
    case "marketplace":
      return <MarketplaceView />;
    case "fairness":
      return <FairnessView />;
    case "help-desk":
      return <HelpDeskView />;
    case "self-exclusion":
      return <SelfExclusionView />;
    default:
      return <DashboardView />;
  }
}
