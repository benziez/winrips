import { useCallback, useEffect, useState } from "react";
import {
  createPlatformDrop,
  LIVE_DROP_INTERVAL_MS,
  prependDrop,
  seedPlatformDrops,
  type PlatformDrop,
} from "../../data/liveDrops";
import { LIVE_FEED_POOL_VERSION } from "../../data/liveFeed";
import type { Card, LobbyCategoryFilter } from "../../types";
import { formatGems } from "../../constants/retail";
import { AssetImage } from "../ui/AssetImage";
import { UserProfileModal } from "./UserProfileModal";

function rarityStyles(rarity: Card["rarity"]): string {
  switch (rarity) {
    case "Ancient Rare":
      return "border-gold/50 text-gold bg-gold/10";
    case "Rare":
      return "border-fuchsia/40 text-fuchsia bg-fuchsia/10";
    default:
      return "border-border text-muted bg-metallic";
  }
}

interface LiveAcquisitionLedgerProps {
  categoryFilter?: LobbyCategoryFilter;
  onOpenProfile?: (username: string) => void;
}

export function LiveAcquisitionLedger({
  categoryFilter = "all",
  onOpenProfile,
}: LiveAcquisitionLedgerProps) {
  const [drops, setDrops] = useState<PlatformDrop[]>(() =>
    seedPlatformDrops(10, categoryFilter),
  );
  const [profileUser, setProfileUser] = useState<string | null>(null);

  const openProfile = onOpenProfile ?? setProfileUser;

  useEffect(() => {
    setDrops(seedPlatformDrops(10, categoryFilter));
  }, [categoryFilter, LIVE_FEED_POOL_VERSION]);

  const pushDrop = useCallback(() => {
    setDrops((prev) => prependDrop(prev, createPlatformDrop(categoryFilter)));
  }, [categoryFilter]);

  useEffect(() => {
    const interval = setInterval(pushDrop, LIVE_DROP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pushDrop]);

  return (
    <>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-obsidian to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-obsidian to-transparent z-10 pointer-events-none" />

        <div className="flex gap-3 overflow-x-auto py-2 px-1 scroll-smooth scrollbar-none">
          {drops.map((drop) => (
            <article
              key={drop.id}
              className="flex shrink-0 items-center gap-3 min-w-[250px] max-w-[290px] rounded-lg border border-border bg-[#121318] p-2.5 hover:border-fuchsia/25 transition-colors"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border p-0.5">
                <AssetImage src={drop.item.image} alt={drop.item.name} />
              </div>
              <div className="min-w-0 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  {drop.isHidden ? (
                    <span className="text-muted font-medium">Hidden Collector</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openProfile(drop.username)}
                      className="font-bold text-white/90 hover:text-fuchsia truncate text-left transition-colors hover:underline"
                    >
                      {drop.username}
                    </button>
                  )}
                  <span className="text-muted shrink-0 tabular-nums">{drop.timestamp}</span>
                </div>
                <p className="text-xs font-bold text-white truncate mt-0.5 uppercase leading-snug">
                  {drop.item.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span
                    className={`text-[8px] px-1.5 py-0.5 border rounded uppercase font-bold tracking-wider ${rarityStyles(drop.item.rarity)}`}
                  >
                    {drop.item.rarity}
                  </span>
                  <span className="text-[8px] text-cyan font-mono tabular-nums">
                    {formatGems(drop.item.value)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {profileUser && (
        <UserProfileModal username={profileUser} onClose={() => setProfileUser(null)} />
      )}
    </>
  );
}
