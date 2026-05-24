import { useApp } from "../../context/AppContext";
import { DashboardView } from "../dashboard/DashboardView";
import { PackOpeningView } from "../pack-opening/PackOpeningView";
import { VaultView } from "../../views/VaultView";
import { PlayHistoryView } from "../../views/PlayHistoryView";
import { UpgraderView } from "../../views/UpgraderView";
import { BattlesLobbyView } from "../../views/BattlesLobbyView";
import { BattleArenaView } from "../../views/BattleArenaView";
import { LeaderboardView } from "./LeaderboardView";
import { RewardsView } from "./RewardsView";
import { MarketplaceView } from "./MarketplaceView";
import { FairnessView } from "./FairnessView";
import { HelpDeskView } from "./HelpDeskView";
import { SelfExclusionView } from "./SelfExclusionView";
import { AdminView } from "../../views/AdminView";

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
    case "play-history":
      return <PlayHistoryView />;
    case "upgrader":
      return <UpgraderView />;
    case "battles":
      return <BattlesLobbyView />;
    case "battle-arena":
      return <BattleArenaView />;
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
    case "admin":
      return <AdminView />;
    default:
      return <DashboardView />;
  }
}
