import { LiveTicker } from "./LiveTicker";
import { PackLobby } from "./PackLobby";

export function DashboardView() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-8 sm:pt-4 sm:pb-10 max-w-[1600px] mx-auto w-full space-y-4">
      <LiveTicker />
      <PackLobby />
    </div>
  );
}
