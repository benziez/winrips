import { useState } from "react";
import { formatGems, formatUsd, gemsToUsd } from "../../constants/retail";
import { isAppStoreCommerce } from "../../constants/commerce";
import { LEADERBOARD } from "../../data/leaderboard";
import { UserProfileModal } from "../dashboard/UserProfileModal";

export function LeaderboardView() {
  const [profileUser, setProfileUser] = useState<string | null>(null);

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 max-w-[1600px] mx-auto w-full">
        <header className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia mb-1">
            Collector Rankings
          </p>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Collector Leaderboard
          </h1>
          <p className="text-muted text-xs mt-1">
            Ranked by total unboxing volume this season — click a collector to view their trophy
            case
          </p>
        </header>

        <div className="rounded-xl border border-border bg-[#121318] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Collector</th>
                <th className="px-4 py-3 font-semibold text-right">Volume</th>
                <th className="px-4 py-3 font-semibold text-right hidden sm:table-cell">
                  Opens
                </th>
              </tr>
            </thead>
            <tbody>
              {LEADERBOARD.map((row) => (
                <tr
                  key={row.rank}
                  className="border-b border-border/60 last:border-0 hover:bg-metallic/50 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-muted tabular-nums">#{row.rank}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setProfileUser(row.username)}
                      className={`font-semibold hover:text-fuchsia transition-colors hover:underline underline-offset-2 ${
                        row.isGold ? "text-gold" : "text-white"
                      }`}
                    >
                      {row.username}
                    </button>
                    {row.isGold && (
                      <span className="ml-2 text-[9px] font-bold uppercase tracking-wide text-gold/80 border border-gold/30 rounded px-1.5 py-0.5">
                        Gold
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-gold">
                    {isAppStoreCommerce()
                      ? formatUsd(gemsToUsd(row.volume))
                      : formatGems(row.volume)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted tabular-nums hidden sm:table-cell">
                    {row.pulls.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {profileUser && (
        <UserProfileModal username={profileUser} onClose={() => setProfileUser(null)} />
      )}
    </>
  );
}
