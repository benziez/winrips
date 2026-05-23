import { PackLobby } from "./PackLobby";

export function DashboardView() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 px-4 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-4 lg:px-8">
      <PackLobby />
    </div>
  );
}
