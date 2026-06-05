import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "../../types";
import type { StoreRarity } from "../../types/store";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { useApp } from "../../context/AppContext";
import {
  WINS_WEEK_END_ISO,
  WINS_WEEK_LABEL,
  WINS_WEEK_START_ISO,
  WINS_WEEKLY_LEADERBOARD,
  winsWeeklyRankForGems,
  type WinsWeeklyLeaderboardEntry,
} from "../../constants/winsWeeklyLeaderboard";
import { resolveFeaturedCards, type ResolvedFeaturedCard } from "../../constants/winsFeaturedCards";
import { findCatalogItemImageUrl } from "../../data/boxCatalog";
import {
  fetchUserWeeklyBestPull,
  fetchUserWeeklyPullGems,
  type WeeklyBestPull,
} from "../../lib/vaultItems";
import { generatedHandleFromUserId } from "../../utils/generatedHandle";
import { glowPaletteForStoreRarity } from "../../utils/rarityGlowColors";
import { resolveCollectibleImageSrc } from "../../utils/collectibleImageSrc";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { BalancePill } from "./rip/BalancePill";
import { CategorySelector } from "./rip/CategorySelector";
import { CategorySheet } from "./rip/CategorySheet";
import { AddFundsModal } from "./rip/AddFundsModal";
import { CardDetailOverlay } from "./rip/CardDetailOverlay";
import { MobileHomeLogoButton } from "./MobileHomeLogoButton";
import { CollectibleImage } from "../ui/CollectibleImage";
import { mobileHeaderSafePaddingStyle } from "./mobileShellTheme";
import { hapticMediumImpact, hapticTabSelect } from "../../utils/mobileHaptics";

const SHOW_CATEGORY_SELECTOR = false;
const TICKER_DURATION_MS = 1_500;

type WinsTab = "featured-cards" | "leaderboard";
type PodiumMetal = "gold" | "silver" | "bronze";
type PodiumTier = 1 | 2 | 3;

const PODIUM_METAL_CLASS: Record<PodiumMetal, string> = {
  gold: "wins-podium-gold",
  silver: "wins-podium-silver",
  bronze: "wins-podium-bronze",
};

const PODIUM_TIER_CLASS: Record<PodiumTier, string> = {
  1: "wins-podium-tier-1",
  2: "wins-podium-tier-2",
  3: "wins-podium-tier-3",
};

const HOF_HOLO_CLASS: Record<StoreRarity, string> = {
  Common: "hof-holo-shimmer--common",
  Rare: "hof-holo-shimmer--rare",
  Epic: "hof-holo-shimmer--epic",
  Legendary: "hof-holo-shimmer--legendary",
  Mythic: "hof-holo-shimmer--mythic",
};

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function formatLeaderboardHandle(username: string): string {
  const trimmed = username.trim();
  if (!trimmed) return "@collector";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function normalizeStoreRarity(value: string): StoreRarity {
  const tier = value.trim() as StoreRarity;
  if (tier in HOF_HOLO_CLASS) return tier;
  return "Common";
}

function hofHoloClassForStoreRarity(storeRarity: string): string {
  return HOF_HOLO_CLASS[normalizeStoreRarity(storeRarity)];
}

function usernameInitial(username: string): string {
  const stripped = username.replace(/^@/, "").trim();
  return (stripped[0] ?? "?").toUpperCase();
}

function usernameAvatarGradient(username: string): string {
  let hash = 0;
  const key = username.replace(/^@/, "").trim().toLowerCase();
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const hue2 = (hue + 42) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 68%, 52%), hsl(${hue2}, 72%, 38%))`;
}

function featuredCardToCard(card: ResolvedFeaturedCard): Card {
  return {
    id: card.catalogItemId,
    name: card.displayName,
    rarity: card.storeRarity === "Mythic" || card.storeRarity === "Legendary" ? "Ancient Rare" : card.storeRarity === "Common" ? "Common" : "Rare",
    value: card.displayGems,
    image: card.image,
  };
}

function leaderboardEntryImage(entry: WinsWeeklyLeaderboardEntry): string {
  return resolveCollectibleImageSrc(findCatalogItemImageUrl(entry.bestPullCatalogId), {
    thumbnail: true,
  });
}

function AnimatedUsdTicker({
  gems,
  animationKey,
}: {
  gems: number;
  animationKey: number;
}) {
  const [displayGems, setDisplayGems] = useState(0);

  useEffect(() => {
    if (animationKey <= 0) {
      setDisplayGems(0);
      return;
    }

    let frameId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / TICKER_DURATION_MS);
      setDisplayGems(Math.round(gems * easeOutCubic(progress)));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    setDisplayGems(0);
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [gems, animationKey]);

  return (
    <span className="shrink-0 font-bold tabular-nums text-[var(--rip-green-bright)]">
      {formatUsd(gemsToUsd(displayGems))}
    </span>
  );
}

function PullThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a]">
      <img src={src} alt={alt} className="h-full w-full object-contain p-0.5" loading="lazy" />
    </div>
  );
}

function UsernameAvatar({ username }: { username: string }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
      style={{ background: usernameAvatarGradient(username) }}
      aria-hidden
    >
      {usernameInitial(username)}
    </div>
  );
}

function FeaturedCardTile({
  card,
  index,
  onSelect,
}: {
  card: ResolvedFeaturedCard;
  index: number;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      <div
        className="flex aspect-[2/3.35] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
        style={{ boxShadow: "var(--rip-shadow-pack)" }}
      >
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0a0a0a]">
          <CollectibleImage
            src={resolveCollectibleImageSrc(card.image, { thumbnail: false })}
            alt={card.displayName}
            className="relative z-[1] h-full w-full object-contain p-1"
            optimize={false}
            thumbnail={false}
            priority={index < 4}
            loading={index < 4 ? "eager" : "lazy"}
            width={200}
            height={335}
            aspectRatio="2 / 3.35"
            placeholderTintRgb={glowPaletteForStoreRarity(card.storeRarity).rgb}
          />
          <div
            className={`hof-holo-shimmer ${hofHoloClassForStoreRarity(card.storeRarity)}`}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[45%] bg-gradient-to-b from-transparent to-[#111]"
            aria-hidden
          />
        </div>
        <div className="flex shrink-0 flex-col justify-center gap-0.5 overflow-visible px-2.5 py-2.5 min-h-[88px]">
          <p className="truncate text-[13px] font-bold leading-tight text-white">{card.displayName}</p>
          <p className="shrink-0 whitespace-nowrap text-[12px] font-bold tabular-nums leading-none text-[var(--rip-green-bright)]">
            {formatUsd(card.displayUsd)}
          </p>
          <p className="truncate text-[10px] leading-tight text-[var(--rip-text-muted)]">
            Available to pull
          </p>
        </div>
      </div>
    </button>
  );
}

function WinsTabToggle({
  active,
  onChange,
}: {
  active: WinsTab;
  onChange: (tab: WinsTab) => void;
}) {
  return (
    <div className="flex gap-2 px-6">
      {(
        [
          { id: "featured-cards" as const, label: "Featured Cards" },
          { id: "leaderboard" as const, label: "Leaderboard" },
        ] as const
      ).map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              void hapticTabSelect();
              onChange(tab.id);
            }}
            className={`flex-1 rounded-full py-2.5 text-[14px] font-semibold transition-colors ${
              selected
                ? "bg-white text-black"
                : "border border-white/10 bg-[#111] text-[var(--rip-text-muted)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function PodiumSparkles() {
  return (
    <div className="wins-podium-sparkles" aria-hidden>
      <span className="wins-sparkle wins-sparkle--1" />
      <span className="wins-sparkle wins-sparkle--2" />
      <span className="wins-sparkle wins-sparkle--3" />
      <span className="wins-sparkle wins-sparkle--4" />
      <span className="wins-sparkle wins-sparkle--5" />
      <span className="wins-sparkle wins-sparkle--6" />
    </div>
  );
}

function PodiumCard({
  entry,
  metal,
  tier,
  animationKey,
}: {
  entry: WinsWeeklyLeaderboardEntry;
  metal: PodiumMetal;
  tier: PodiumTier;
  animationKey: number;
}) {
  const imageSrc = leaderboardEntryImage(entry);
  const isFirst = tier === 1;

  return (
    <div className={`relative w-full ${PODIUM_TIER_CLASS[tier]}`}>
      {isFirst ? <PodiumSparkles /> : null}
      <div
        className={`flex h-full w-full flex-col items-center rounded-2xl px-2 py-3 ${PODIUM_METAL_CLASS[metal]}`}
      >
        <span className={`leading-none ${isFirst ? "text-[26px]" : tier === 2 ? "text-[20px]" : "text-[18px]"}`} aria-hidden>
          🏆
        </span>
        <span
          className={`mt-1 font-bold tabular-nums text-white ${
            isFirst ? "text-[22px]" : tier === 2 ? "text-[17px]" : "text-[15px]"
          }`}
        >
          #{entry.rank}
        </span>
        <div
          className={`mt-2 overflow-hidden rounded-lg border border-white/15 bg-black/30 ${
            isFirst ? "h-12 w-12" : tier === 2 ? "h-10 w-10" : "h-9 w-9"
          }`}
        >
          <img src={imageSrc} alt="" className="h-full w-full object-contain p-0.5" loading="lazy" />
        </div>
        <p
          className={`mt-2 w-full truncate text-center font-semibold text-white ${
            isFirst ? "text-[13px]" : tier === 2 ? "text-[11px]" : "text-[10px]"
          }`}
        >
          {formatLeaderboardHandle(entry.username)}
        </p>
        <div className={`mt-1 ${isFirst ? "text-[15px]" : tier === 2 ? "text-[13px]" : "text-[12px]"}`}>
          <AnimatedUsdTicker gems={entry.weeklyGems} animationKey={animationKey} />
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  animationKey,
  isLast = false,
}: {
  entry: WinsWeeklyLeaderboardEntry;
  animationKey: number;
  isLast?: boolean;
}) {
  const imageSrc = leaderboardEntryImage(entry);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${
        isLast ? "" : "border-b border-white/[0.06]"
      }`}
    >
      <span className="w-7 shrink-0 text-[14px] font-bold tabular-nums text-[var(--rip-text-muted)]">
        #{entry.rank}
      </span>
      <UsernameAvatar username={entry.username} />
      <PullThumbnail src={imageSrc} alt={entry.username} />
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">
        {formatLeaderboardHandle(entry.username)}
      </span>
      <AnimatedUsdTicker gems={entry.weeklyGems} animationKey={animationKey} />
    </div>
  );
}

function LeaderboardPanel({
  userWeeklyGems,
  userHandle,
  userBestPull,
  animationKey,
}: {
  userWeeklyGems: number;
  userHandle: string;
  userBestPull: WeeklyBestPull | null;
  animationKey: number;
}) {
  const userRank = winsWeeklyRankForGems(userWeeklyGems);
  const topThree = WINS_WEEKLY_LEADERBOARD.slice(0, 3);
  const rest = WINS_WEEKLY_LEADERBOARD.slice(3);

  const userThumbSrc = useMemo(() => {
    if (userBestPull?.image) {
      return resolveCollectibleImageSrc(userBestPull.image, { thumbnail: true });
    }
    return resolveCollectibleImageSrc(findCatalogItemImageUrl("pk-starter-01"), {
      thumbnail: true,
    });
  }, [userBestPull]);

  const [first, second, third] = topThree;

  return (
    <div className="px-6">
      <p className="mb-4 text-center text-[13px] font-medium text-[var(--rip-text-muted)]">
        {WINS_WEEK_LABEL}
      </p>

      {first && second && third ? (
        <div className="mb-4 grid grid-cols-3 items-end gap-2">
          <PodiumCard entry={second} metal="silver" tier={2} animationKey={animationKey} />
          <PodiumCard entry={first} metal="gold" tier={1} animationKey={animationKey} />
          <PodiumCard entry={third} metal="bronze" tier={3} animationKey={animationKey} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
        <ul>
          {rest.map((entry, index) => (
            <li key={entry.username}>
              <LeaderboardRow
                entry={entry}
                animationKey={animationKey}
                isLast={index === rest.length - 1}
              />
            </li>
          ))}
        </ul>
        <div className="wins-you-row-pulse border-t border-white/10 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="w-7 shrink-0 text-[14px] font-bold tabular-nums text-white">You</span>
            <UsernameAvatar username={userHandle} />
            <PullThumbnail src={userThumbSrc} alt={userHandle} />
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">
              {formatLeaderboardHandle(userHandle)} • #{userRank}
            </span>
            <AnimatedUsdTicker gems={userWeeklyGems} animationKey={animationKey} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const MobileShowroomView = memo(function MobileShowroomView({
  isActive = true,
}: {
  isActive?: boolean;
}) {
  const { userId, profileUsername } = useApp();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WinsTab>("featured-cards");
  const [leaderboardAnimKey, setLeaderboardAnimKey] = useState(0);
  const [userWeeklyGems, setUserWeeklyGems] = useState(0);
  const [userBestPull, setUserBestPull] = useState<WeeklyBestPull | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const featuredCards = useMemo(() => resolveFeaturedCards(), []);

  const userHandle =
    profileUsername?.trim() ||
    (userId ? generatedHandleFromUserId(userId) : "guest");

  const handleTabChange = useCallback((tab: WinsTab) => {
    if (tab === "leaderboard") {
      setLeaderboardAnimKey((key) => key + 1);
    }
    setActiveTab(tab);
  }, []);

  const refreshUserWeekly = useCallback(async () => {
    if (!userId) {
      setUserWeeklyGems(0);
      setUserBestPull(null);
      return;
    }
    const [total, bestPull] = await Promise.all([
      fetchUserWeeklyPullGems(userId, WINS_WEEK_START_ISO, WINS_WEEK_END_ISO),
      fetchUserWeeklyBestPull(userId, WINS_WEEK_START_ISO, WINS_WEEK_END_ISO),
    ]);
    setUserWeeklyGems(total);
    setUserBestPull(bestPull);
  }, [userId]);

  useEffect(() => {
    if (!isActive) return;
    void refreshUserWeekly();
  }, [isActive, refreshUserWeekly]);

  return (
    <RipAmbientShell>
      <header
        className="relative z-[10000] flex shrink-0 items-center justify-between border-none px-6 pb-3 shadow-none"
        style={{ ...mobileHeaderSafePaddingStyle, background: "#000000" }}
      >
        {SHOW_CATEGORY_SELECTOR ? (
          <CategorySelector onPress={() => setCategoryOpen(true)} />
        ) : (
          <MobileHomeLogoButton />
        )}
        <BalancePill onAddFunds={() => setAddFundsOpen(true)} />
      </header>

      <div
        ref={scrollRef}
        className="h-full min-h-0 flex-1 transform-gpu overflow-y-auto overscroll-contain pb-4"
      >
        <h1 className="mb-5 px-6 pt-2 text-[32px] font-bold leading-tight text-white">Wins</h1>

        <WinsTabToggle active={activeTab} onChange={handleTabChange} />

        {activeTab === "featured-cards" ? (
          <div className="mt-6 px-6">
            <h2 className="mb-4 text-[22px] font-bold leading-tight text-white">What&apos;s Possible</h2>
            <div className="grid grid-cols-2 gap-4">
              {featuredCards.map((card, index) => (
                <FeaturedCardTile
                  key={card.catalogItemId}
                  card={card}
                  index={index}
                  onSelect={() => {
                    void hapticMediumImpact();
                    setSelectedCard(featuredCardToCard(card));
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <LeaderboardPanel
              userWeeklyGems={userWeeklyGems}
              userHandle={userHandle}
              userBestPull={userBestPull}
              animationKey={leaderboardAnimKey}
            />
          </div>
        )}
      </div>

      <CategorySheet open={categoryOpen} onClose={() => setCategoryOpen(false)} />
      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
      <CardDetailOverlay
        card={selectedCard}
        open={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
      />
    </RipAmbientShell>
  );
});
