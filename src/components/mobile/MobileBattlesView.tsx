import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useBoxesCatalog } from "../../context/BoxesCatalogContext";
import { useAuth } from "../../context/AuthContext";
import { RipAmbientShell } from "./rip/RipAmbientShell";
import { BalancePill } from "./rip/BalancePill";
import { AddFundsModal } from "./rip/AddFundsModal";
import { PackCatalogImage } from "./PackCatalogImage";
import { PackTileTopBadges } from "./PackTileTopBadges";
import { PackBattleFlow } from "./battles/PackBattleFlow";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { normalizePackId } from "../../constants/packIdAliases";
import { isLimitedDropPackId, isInfiniteSeriesPackId, type LimitedDropPackId } from "../../constants/packs";
import { consumePendingBattlePackId } from "../../constants/packBattleNavigation";
import { formatPackTopHitUsd } from "../../utils/packValueRange";
import {
  getLimitedDropOpenBlockMessage,
  getLimitedDropWindowState,
  isLimitedDropAvailable,
} from "../../utils/limitedDropWindows";
import { hapticMediumImpact, hapticTabSelect } from "../../utils/mobileHaptics";
import type { BattleRecord } from "../../lib/packBattleLogic";
import {
  battleRecordFromQuery,
  useBattleRecord,
  useSetBattleRecordCache,
  useTopBattlers,
} from "../../queries/packBattles";
import { queryKeys } from "../../queries/queryKeys";
import {
  battleWinRatePercent,
  resolveBattleRank,
} from "../../utils/packBattleRank";
import { BattleRankBadge } from "./battles/BattleRankBadge";
import { BattleRanksSheet } from "./battles/BattleRanksSheet";
import { BattleLeaderboardPanel } from "./battles/BattleLeaderboardPanel";
import { MobileHomeLogoButton } from "./MobileHomeLogoButton";
import { mobileHeaderSafePaddingStyle } from "./mobileShellTheme";
import type { Pack } from "../../types";

/** Matches lobby Regular Packs row accent glows. */
const BATTLE_PACK_GLOW_COLORS: Record<string, string> = {
  "trainers-starter": "#FF007F",
  "mega-evolution": "#9B59B6",
  "151-booster-collector": "#3498DB",
  "legendary-hunt": "#27AE60",
  "shiny-vault": "#BDC3C7",
  "prismatic-sir": "#FF6B9D",
  "evolving-skies": "#1ABC9C",
  "psa-10-chaser": "#E74C3C",
  "obsidian-vault": "#6C3483",
  "god-pack-1999": "#F39C12",
  "wotc-first-edition": "#D4AC0D",
  "waifu-vault": "#FF69B4",
  "infinite-prime": "#D4AF37",
  "infinite-apex": "#D4AF37",
  "infinite-zenith": "#D4AF37",
  "infinite-omega": "#D4AF37",
};

const INFINITE_SERIES_GLOW = "#D4AF37";

function battlePackGlowColor(packId: string): string | undefined {
  return BATTLE_PACK_GLOW_COLORS[normalizePackId(packId)];
}

function BattleRecordStatsSkeleton() {
  return (
    <>
      <div className="mx-auto mt-2 h-9 w-44 animate-pulse rounded-lg bg-white/10" aria-hidden />
      <div className="mx-auto mt-2 h-5 w-32 animate-pulse rounded-md bg-white/10" aria-hidden />
      <div className="mx-auto mt-1.5 h-4 w-36 animate-pulse rounded-md bg-white/8" aria-hidden />
      <div className="mx-auto mt-3 h-8 w-28 animate-pulse rounded-full bg-white/10" aria-hidden />
    </>
  );
}

function BattlePackTile({
  pack,
  index,
  nowMs,
  onSelect,
  frameClassName,
  borderClassName,
  priceClassName,
  glowColorOverride,
}: {
  pack: Pack;
  index: number;
  nowMs: number;
  onSelect: (pack: Pack) => void;
  frameClassName?: string;
  borderClassName?: string;
  priceClassName?: string;
  glowColorOverride?: string;
}) {
  const isInfinite = isInfiniteSeriesPackId(pack.id);
  const glowColor = glowColorOverride ?? battlePackGlowColor(pack.id);
  const topHitLabel = formatPackTopHitUsd(pack.id);
  const isLimitedDrop = isLimitedDropPackId(pack.id);
  const limitedDropAvailable = !isLimitedDrop || isLimitedDropAvailable(pack.id, nowMs);
  const limitedDropBlockMessage = isLimitedDrop
    ? getLimitedDropOpenBlockMessage(pack.id, nowMs)
    : null;
  const limitedDropWindow = isLimitedDrop
    ? getLimitedDropWindowState(pack.id as LimitedDropPackId, nowMs)
    : null;

  return (
    <motion.button
      type="button"
      whileTap={limitedDropAvailable ? { scale: 0.97 } : undefined}
      disabled={!limitedDropAvailable}
      onClick={() => {
        if (!limitedDropAvailable) return;
        void hapticMediumImpact();
        onSelect(pack);
      }}
      aria-label={
        limitedDropAvailable
          ? `Battle with ${pack.name}`
          : `${pack.name} unavailable — ${limitedDropBlockMessage ?? "limited drop closed"}`
      }
      aria-disabled={!limitedDropAvailable}
      className={`flex w-full min-w-0 flex-col overflow-hidden text-left${
        limitedDropAvailable ? "" : " cursor-not-allowed opacity-50"
      }`}
    >
      <div
        className={`flex aspect-[2/3.35] w-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-[#111] ${
          frameClassName ??
          (borderClassName ?? "border-white/10")
        }`}
        style={{
          boxShadow: isInfinite
            ? "0 0 22px rgba(212,175,55,0.22), 0 0 8px rgba(212,175,55,0.12), var(--rip-shadow-pack)"
            : "var(--rip-shadow-pack)",
        }}
      >
        <div className="relative min-h-0 flex-[4] overflow-hidden rounded-t-2xl">
          {glowColor ? (
            <div
              className="pointer-events-none absolute left-1/2 top-[45%] z-0 h-[72%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
              style={{ backgroundColor: glowColor, opacity: 0.42 }}
              aria-hidden
            />
          ) : null}
          <div
            className="relative z-[1] h-full w-full"
            style={
              glowColor
                ? {
                    filter: `drop-shadow(0 0 18px ${glowColor}99) drop-shadow(0 0 8px ${glowColor}66)`,
                  }
                : undefined
            }
          >
            <PackCatalogImage
              packId={pack.id}
              src={pack.image}
              alt={pack.name}
              priority={index < 4}
              className="h-full w-full"
            />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[45%] bg-gradient-to-b from-transparent to-[#111]"
            aria-hidden
          />
          <PackTileTopBadges
            topHitLabel={topHitLabel}
            infiniteLabel={
              isInfinite
                ? pack.id === "infinite-omega"
                  ? "∞ Legendary"
                  : "∞ Infinite"
                : null
            }
            insetClassName="inset-x-3 top-3"
          />
        </div>
        <div className="flex min-h-0 min-w-0 flex-[1] flex-col justify-center gap-0.5 px-2.5 py-2">
          <p className="min-w-0 line-clamp-1 text-sm font-bold leading-tight text-white sm:text-base">
            {pack.name}
          </p>
          <p
            className={`shrink-0 flex-shrink-0 text-xs font-bold tabular-nums sm:text-[12px] ${
              priceClassName ?? "text-[var(--rip-green-bright)]"
            }`}
          >
            {formatUsd(gemsToUsd(pack.cost))}
          </p>
          {isLimitedDrop && limitedDropWindow?.isLive ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0 flex-shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--rip-green-bright)] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--rip-green-bright)]" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--rip-green-bright)]">
                Live now
              </p>
            </div>
          ) : limitedDropBlockMessage ? (
              <p className="min-w-0 line-clamp-2 text-[11px] font-semibold leading-snug text-white/70">
                {limitedDropBlockMessage}
              {limitedDropWindow && !limitedDropWindow.isLive && limitedDropWindow.countdownLabel
                ? ` · ${limitedDropWindow.countdownLabel}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}

export const MobileBattlesView = memo(function MobileBattlesView() {
  const { userId, isLoggedIn, openAuthModal, goldVolts, showErrorToast } = useApp();
  const { user } = useAuth();
  const { packs, loading } = useBoxesCatalog();
  const queryClient = useQueryClient();
  const setBattleRecordCache = useSetBattleRecordCache();
  const { data: recordData, isPending: recordPending } = useBattleRecord(userId);
  const { record, showSkeleton: recordSkeleton } = battleRecordFromQuery(
    recordData,
    recordPending,
  );
  const { data: leaderboard = [] } = useTopBattlers(10, Boolean(userId));
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [activePack, setActivePack] = useState<Pack | null>(null);
  const [ranksSheetOpen, setRanksSheetOpen] = useState(false);
  const [battleNowMs, setBattleNowMs] = useState(() => Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  const userHandle = useMemo(() => {
    const meta = user?.user_metadata?.username;
    if (typeof meta === "string" && meta.trim()) return meta.trim();
    return "You";
  }, [user?.user_metadata?.username]);

  const rank = useMemo(() => resolveBattleRank(record.wins, record.losses), [record]);
  const totalBattles = record.wins + record.losses;

  const infiniteSeriesPacks = useMemo(
    () =>
      [...packs]
        .filter((pack) => isInfiniteSeriesPackId(pack.id))
        .sort((a, b) => a.cost - b.cost),
    [packs],
  );

  const standardBattlePacks = useMemo(
    () =>
      [...packs]
        .filter((pack) => !isInfiniteSeriesPackId(pack.id))
        .sort((a, b) => a.cost - b.cost),
    [packs],
  );

  useEffect(() => {
    const clockId = window.setInterval(() => {
      setBattleNowMs(Date.now());
    }, 1_000);
    return () => window.clearInterval(clockId);
  }, []);

  const handleSelectPack = useCallback((pack: Pack) => {
    if (!isLoggedIn || !userId) {
      openAuthModal("login");
      return false;
    }
    const limitedDropBlock = getLimitedDropOpenBlockMessage(pack.id);
    if (limitedDropBlock) {
      showErrorToast(limitedDropBlock);
      return false;
    }
    if (goldVolts < pack.cost) {
      showErrorToast(`Need ${formatUsd(gemsToUsd(pack.cost))} to battle this pack.`);
      setAddFundsOpen(true);
      return false;
    }
    void hapticTabSelect();
    setActivePack(pack);
    return true;
  }, [goldVolts, isLoggedIn, openAuthModal, showErrorToast, userId]);

  useEffect(() => {
    if (loading || packs.length === 0) return;
    const pendingPackId = consumePendingBattlePackId();
    if (!pendingPackId) return;
    const pendingPack = packs.find((pack) => normalizePackId(pack.id) === normalizePackId(pendingPackId));
    if (!pendingPack) return;
    handleSelectPack(pendingPack);
  }, [handleSelectPack, loading, packs]);

  const battleFlowPortal =
    typeof document !== "undefined" && activePack
      ? createPortal(
          <AnimatePresence>
            <PackBattleFlow
              key={activePack.id}
              pack={activePack}
              userHandle={userHandle}
              record={record}
              onRecordChange={(next: BattleRecord) => {
                if (userId) setBattleRecordCache(userId, next);
                void queryClient.invalidateQueries({ queryKey: queryKeys.topBattlers(10) });
              }}
              onClose={() => setActivePack(null)}
              onBattleAgain={() => {
                const pack = activePack;
                setActivePack(null);
                window.setTimeout(() => setActivePack(pack), 50);
              }}
            />
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <RipAmbientShell>
      {!activePack ? (
        <>
      <header
        className="relative z-[10000] flex shrink-0 items-center justify-between border-none px-6 pb-3 shadow-none"
        style={{ ...mobileHeaderSafePaddingStyle, background: "#000000" }}
      >
        <MobileHomeLogoButton />
        <BalancePill onAddFunds={() => setAddFundsOpen(true)} />
      </header>

      <div
        ref={scrollRef}
        className="flex h-full min-h-0 flex-1 transform-gpu flex-col overflow-y-auto overscroll-contain px-6 pb-4"
      >
        <div>
          <h1 className="text-[30px] font-bold text-white">Battles</h1>
          <p className="text-[13px] text-[var(--rip-text-muted)]">1v1 pack showdowns</p>
        </div>

        <div className="battle-neon-border relative mt-8 flex flex-col items-center rounded-2xl bg-gradient-to-r from-[#1a0000] to-[#0a0000] px-5 py-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--rip-text-muted)]">
            Your Record
          </p>
          {recordSkeleton ? (
            <BattleRecordStatsSkeleton />
          ) : (
            <>
              <p className="mt-2 text-[32px] font-bold tabular-nums leading-none text-white">
                {record.wins}W — {record.losses}L
              </p>
              <p className="mt-2 text-[15px] font-semibold tabular-nums text-[var(--rip-green-bright)]">
                {battleWinRatePercent(record.wins, record.losses)}% Win Rate
              </p>
              <p className="mt-1.5 text-[13px] font-medium tabular-nums text-white/50">
                {totalBattles} total battles
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <BattleRankBadge rank={rank} size="md" showTrophy />
                <button
                  type="button"
                  onClick={() => {
                    void hapticTabSelect();
                    setRanksSheetOpen(true);
                  }}
                  aria-label="View battle ranks"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/45 transition-colors active:text-white/70"
                >
                  <Info size={16} aria-hidden />
                </button>
              </div>
            </>
          )}
        </div>

        <section className="mt-8">
          <h2 className="text-[18px] font-bold text-white">Choose Your Pack</h2>
          <p className="mt-1 text-[13px] text-[var(--rip-text-muted)]">
            Same pack, higher pull wins. You keep your card no matter what — winner gets 2% back.
          </p>

          {loading ? (
            <p className="mt-6 text-center text-[14px] text-white/45">Loading packs...</p>
          ) : (
            <div className="mt-4">
              {standardBattlePacks.length > 0 ? (
                <div className="space-y-3">
                  {infiniteSeriesPacks.length > 0 ? (
                    <h3 className="text-[15px] font-bold text-white">All Packs</h3>
                  ) : null}
                  <div className="grid grid-cols-2 gap-4">
                    {standardBattlePacks.map((pack, index) => (
                      <BattlePackTile
                        key={pack.id}
                        pack={pack}
                        index={index}
                        nowMs={battleNowMs}
                        onSelect={handleSelectPack}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {infiniteSeriesPacks.length > 0 ? (
                <div
                  className={`space-y-3${standardBattlePacks.length > 0 ? " mt-6" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.75)]"
                      style={{ backgroundColor: INFINITE_SERIES_GLOW }}
                      aria-hidden
                    />
                    <h3 className="text-[15px] font-bold text-white">Infinite Series</h3>
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200/90">
                      High Roller
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {infiniteSeriesPacks.map((pack, index) => {
                      const isOmega = pack.id === "infinite-omega";
                      return (
                        <BattlePackTile
                          key={pack.id}
                          pack={pack}
                          index={index}
                          nowMs={battleNowMs}
                          onSelect={handleSelectPack}
                          glowColorOverride={INFINITE_SERIES_GLOW}
                          frameClassName={
                            isOmega
                              ? "infinite-omega-pack-frame border-amber-300/50"
                              : "border-amber-400/35"
                          }
                          priceClassName="text-amber-200"
                        />
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-[18px] font-bold text-white">Top Battlers</h2>
          <p className="mt-1 text-[13px] text-[var(--rip-text-muted)]">Ranked by total wins</p>
          <BattleLeaderboardPanel
            rows={leaderboard}
            currentUser={
              userId && totalBattles > 0
                ? {
                    userId,
                    username: userHandle,
                    wins: record.wins,
                    losses: record.losses,
                    winRate: battleWinRatePercent(record.wins, record.losses),
                  }
                : null
            }
          />
        </section>
      </div>
        </>
      ) : null}

      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />

      <BattleRanksSheet
        open={ranksSheetOpen}
        onClose={() => setRanksSheetOpen(false)}
        currentRankId={rank.id}
      />

      {battleFlowPortal}
    </RipAmbientShell>
  );
});
