import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useBoxesCatalog } from "../context/BoxesCatalogContext";
import { SessionAuthWall } from "../components/auth/SessionAuthWall";
import { UnboxingCarousel } from "../components/pack-opening/UnboxingCarousel";
import { CollectibleImage } from "../components/ui/CollectibleImage";
import { formatGems } from "../constants/retail";
import {
  canJoinBattle,
  fetchBattleById,
  fetchBattleUsernames,
  isBattleCreator,
  joinBattle,
  resolveBattle,
  type BattleDetail,
  type BattleParticipant,
  type BattleParticipantResult,
  type BattlePull,
  type BattleResolution,
} from "../lib/battleLogic";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import type { Card } from "../types";
import type { CatalogPack } from "../types/box";
import {
  buildPreviewCarouselStrip,
  ROULETTE_SPIN_MS,
} from "../utils/rng";

type ArenaPhase = "loading" | "waiting" | "opening" | "resolving" | "completed";

const PAGE_SHELL =
  "mx-auto w-full max-w-[1600px] space-y-6 overflow-x-hidden px-4 pb-10 pt-3 sm:px-6 sm:pt-4 lg:px-8";

function formatBoxLabel(boxIds: string[], packsById: Map<string, CatalogPack>): string {
  const names = boxIds.map((boxId) => packsById.get(boxId)?.name ?? boxId).filter(Boolean);
  if (names.length === 0) return "Box Battle";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} + ${names[1]}`;
  return `${names[0]} + ${names.length - 1} more`;
}

function getParticipantResult(
  resolution: BattleResolution | null,
  participant: BattleParticipant | null,
): BattleParticipantResult | null {
  if (!resolution || !participant) return null;
  return resolution.standings.find((standing) => standing.userId === participant.userId) ?? null;
}

function ArenaPlayerColumn({
  participant,
  displayName,
  isWinner,
  spinning,
  carouselCards,
  showCarousel,
  pulls,
  runningTotal,
  statusLabel,
}: {
  participant: BattleParticipant | null;
  displayName: string;
  isWinner: boolean;
  spinning: boolean;
  carouselCards: Card[];
  showCarousel: boolean;
  pulls: BattlePull[];
  runningTotal: number;
  statusLabel: string;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-xl border bg-white/5 shadow-2xl backdrop-blur-md ${
        isWinner
          ? "border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
          : "border-white/10"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"
        aria-hidden
      />
      <div className="relative border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {participant ? `Player ${participant.position}` : "Open Slot"}
            </p>
          </div>
          {isWinner ? (
            <span className="shrink-0 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-gold">
              Winner
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative min-h-[180px] border-b border-white/10 bg-[#0A0A0C]/40 p-3 sm:min-h-[220px] sm:p-4">
        {showCarousel && carouselCards.length > 0 ? (
          <UnboxingCarousel cards={carouselCards} isSpinning={spinning} />
        ) : pulls.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pulls.map((pull, index) => (
              <div
                key={`${pull.itemId}-${index}`}
                className="overflow-hidden rounded-lg border border-white/10 bg-white/5 p-2"
              >
                <CollectibleImage
                  src={pull.imageUrl}
                  alt={pull.itemName}
                  className="aspect-[2.5/3.5] w-full object-contain"
                />
                <p className="mt-2 line-clamp-2 text-[10px] font-semibold text-white">
                  {pull.itemName}
                </p>
                <p className="text-[10px] font-bold tabular-nums text-amber-400/90">
                  {formatGems(pull.gemValue)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-white/10 px-4 text-center">
            <span className="text-2xl opacity-40" aria-hidden>
              📦
            </span>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              {statusLabel}
            </p>
          </div>
        )}
      </div>

      <div className="relative space-y-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            Running Total
          </span>
          <span className="text-base font-black tabular-nums text-white">
            {formatGems(runningTotal)}
          </span>
        </div>
      </div>
    </article>
  );
}

export function BattleArenaView() {
  const {
    selectedBattleId,
    navigateToView,
    userId,
    setGoldVolts,
    showCashoutToast,
    syncVaultFromServer,
    openAuthModal,
  } = useApp();
  const { user, authLoading, isAuthenticated } = useAuth();
  const { packs } = useBoxesCatalog();

  const [battle, setBattle] = useState<BattleDetail | null>(null);
  const [usernames, setUsernames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [arenaPhase, setArenaPhase] = useState<ArenaPhase>("loading");
  const [openingRound, setOpeningRound] = useState(-1);
  const [spinning, setSpinning] = useState(false);
  const [resolution, setResolution] = useState<BattleResolution | null>(null);
  const resolveStartedRef = useRef(false);
  const openingStartedRef = useRef(false);

  const battleId = selectedBattleId ?? "";

  const hasBattleAccess =
    !authLoading &&
    isAuthenticated &&
    Boolean(user?.id) &&
    Boolean(userId) &&
    user!.id === userId;

  const packsById = useMemo(() => new Map(packs.map((pack) => [pack.id, pack])), [packs]);

  const loadBattle = useCallback(async () => {
    if (!battleId) return null;
    const row = await fetchBattleById(battleId);
    if (row) {
      setBattle(row);
      if (row.resolution) {
        setResolution(row.resolution);
        setArenaPhase("completed");
      }
      const labels = await fetchBattleUsernames(row.participants.map((p) => p.userId));
      setUsernames(labels);
    }
    return row;
  }, [battleId]);

  useEffect(() => {
    if (!battleId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void loadBattle()
      .then((row) => {
        if (!row) return;
        if (row.status === "completed" || row.resolution) {
          setArenaPhase("completed");
        } else {
          setArenaPhase("waiting");
        }
      })
      .finally(() => setLoading(false));
  }, [battleId, loadBattle]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !battleId) return;

    const client = supabase;
    const channel = client
      .channel(`battle-arena-${battleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "battles",
          filter: `id=eq.${battleId}`,
        },
        () => {
          void loadBattle();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "battle_participants",
          filter: `battle_id=eq.${battleId}`,
        },
        () => {
          void loadBattle();
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [battleId, loadBattle]);

  useEffect(() => {
    if (!battle || arenaPhase === "completed" || arenaPhase === "loading") return;

    if (battle.status === "waiting") {
      setArenaPhase("waiting");
      openingStartedRef.current = false;
      resolveStartedRef.current = false;
      setOpeningRound(-1);
      return;
    }

    if (battle.status === "completed") {
      setResolution(battle.resolution);
      setArenaPhase("completed");
      return;
    }

    if (
      battle.status === "in_progress" &&
      !openingStartedRef.current &&
      arenaPhase !== "opening" &&
      arenaPhase !== "resolving"
    ) {
      openingStartedRef.current = true;
      setArenaPhase("opening");
      setOpeningRound(0);
      setSpinning(true);
    }
  }, [battle, arenaPhase]);

  useEffect(() => {
    if (arenaPhase !== "opening" || !battle) return;

    if (openingRound >= battle.boxIds.length) {
      setSpinning(false);

      if (isBattleCreator(battle, userId) && !resolveStartedRef.current) {
        resolveStartedRef.current = true;
        setArenaPhase("resolving");
        void (async () => {
          const result = await resolveBattle(battle.id);
          if (!result.ok) {
            resolveStartedRef.current = false;
            setArenaPhase("opening");
            showCashoutToast(result.error);
            return;
          }

          setResolution(result.resolution);
          setArenaPhase("completed");
          if (userId) {
            await syncVaultFromServer(userId);
          }
          await loadBattle();
          showCashoutToast("Battle resolved — loot secured for the winner.");
        })();
      } else if (!isBattleCreator(battle, userId)) {
        setArenaPhase("resolving");
      }
      return;
    }

    if (openingRound < 0) return;

    setSpinning(true);
    const timer = window.setTimeout(() => {
      setSpinning(false);
      window.setTimeout(() => {
        setOpeningRound((current) => current + 1);
      }, 350);
    }, ROULETTE_SPIN_MS + 250);

    return () => window.clearTimeout(timer);
  }, [arenaPhase, battle, openingRound, userId, loadBattle, showCashoutToast, syncVaultFromServer]);

  useEffect(() => {
    if (arenaPhase === "resolving" && battle?.status === "completed" && battle.resolution) {
      setResolution(battle.resolution);
      setArenaPhase("completed");
      if (userId) {
        void syncVaultFromServer(userId);
      }
    }
  }, [arenaPhase, battle, userId, syncVaultFromServer]);

  async function handleJoinBattle() {
    if (!battle || !hasBattleAccess) {
      openAuthModal("login");
      return;
    }

    setJoining(true);
    try {
      const result = await joinBattle(battle.id);
      if (!result.ok) {
        showCashoutToast(result.error);
        return;
      }

      setGoldVolts(result.gemsBalance);
      showCashoutToast(`Joined battle — ${formatGems(battle.entryCost)} entry locked in.`);
      await loadBattle();
    } finally {
      setJoining(false);
    }
  }

  if (!battleId) {
    return (
      <div className={PAGE_SHELL}>
        <p className="py-16 text-center text-sm text-muted">No battle selected.</p>
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigateToView("battles")}
            className="text-sm font-semibold text-[#FF007F] hover:underline"
          >
            Back to Battles Lobby
          </button>
        </div>
      </div>
    );
  }

  if (loading && !battle) {
    return (
      <div className={PAGE_SHELL}>
        <p className="py-16 text-center text-sm text-muted">Loading battle arena…</p>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className={PAGE_SHELL}>
        <p className="py-16 text-center text-sm text-muted">Battle not found.</p>
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigateToView("battles")}
            className="text-sm font-semibold text-[#FF007F] hover:underline"
          >
            Back to Battles Lobby
          </button>
        </div>
      </div>
    );
  }

  const playerOne = battle.participants.find((participant) => participant.position === 1) ?? null;
  const playerTwo = battle.participants.find((participant) => participant.position === 2) ?? null;
  const activeResolution = resolution ?? battle.resolution;
  const currentBoxId =
    openingRound >= 0 && openingRound < battle.boxIds.length
      ? battle.boxIds[openingRound]
      : battle.boxIds[0] ?? "";
  const previewStrip = currentBoxId ? buildPreviewCarouselStrip(currentBoxId) : [];
  const showJoin = hasBattleAccess && canJoinBattle(battle, userId);
  const creator = isBattleCreator(battle, userId);
  const boxLabel = formatBoxLabel(battle.boxIds, packsById);

  const statusBanner =
    battle.status === "completed" || arenaPhase === "completed"
      ? "BATTLE COMPLETE"
      : arenaPhase === "resolving"
        ? creator
          ? "FINALIZING OUTCOMES…"
          : "WAITING FOR CREATOR TO FINALIZE…"
        : arenaPhase === "opening"
          ? `ROUND ${Math.min(openingRound + 1, battle.boxIds.length)} / ${battle.boxIds.length}`
          : battle.status === "in_progress"
            ? "BATTLE IN PROGRESS"
            : "WAITING FOR OPPONENT";

  const playerOneResult = getParticipantResult(activeResolution, playerOne);
  const playerTwoResult = getParticipantResult(activeResolution, playerTwo);

  return (
    <div className={PAGE_SHELL}>
      <button
        type="button"
        onClick={() => navigateToView("battles")}
        className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-[#FF007F]"
      >
        ← Back to Battles Lobby
      </button>

      <header className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF007F]">
              {statusBanner}
            </p>
            <h1 className="mt-2 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
              {boxLabel}
            </h1>
            <p className="mt-2 text-sm text-muted">
              1v1 box battle · {battle.boxIds.length}{" "}
              {battle.boxIds.length === 1 ? "box" : "boxes"} ·{" "}
              <span className="font-semibold text-amber-400/90">
                {formatGems(battle.entryCost)} entry
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Pool Value
              </p>
              <p className="text-sm font-bold tabular-nums text-gold">
                {formatGems(battle.entryCost * Math.max(battle.participants.length, 1))}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Status
              </p>
              <p className="text-sm font-bold capitalize text-white">{battle.status.replace("_", " ")}</p>
            </div>
          </div>
        </div>
      </header>

      {!hasBattleAccess ? (
        <SessionAuthWall description="Sign in to join this battle or watch the live unboxing sequence." />
      ) : null}

      {showJoin ? (
        <div className="rounded-xl border border-[#FF007F]/30 bg-[#FF007F]/10 px-5 py-4 text-center sm:px-6">
          <p className="text-sm text-white">
            Player 2 slot open — lock in{" "}
            <span className="font-bold text-amber-400/90">{formatGems(battle.entryCost)}</span> to
            start the rip-off.
          </p>
          <button
            type="button"
            disabled={joining}
            onClick={() => void handleJoinBattle()}
            className="mt-4 rounded-lg bg-[#FF007F] px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all hover:brightness-110 disabled:opacity-60"
          >
            {joining ? "Joining…" : "Join Battle"}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <ArenaPlayerColumn
          participant={playerOne}
          displayName={
            playerOne ? (usernames.get(playerOne.userId) ?? "Player 1") : "Awaiting Creator"
          }
          isWinner={Boolean(activeResolution && playerOne && activeResolution.winnerId === playerOne.userId)}
          spinning={spinning && arenaPhase === "opening"}
          carouselCards={previewStrip}
          showCarousel={arenaPhase === "opening" && openingRound < battle.boxIds.length}
          pulls={playerOneResult?.pulls ?? []}
          runningTotal={
            playerOneResult?.totalPulledValue ?? playerOne?.totalPulledValue ?? 0
          }
          statusLabel={
            arenaPhase === "opening"
              ? "Unboxing…"
              : battle.status === "waiting"
                ? "Creator Seated"
                : "Ready"
          }
        />
        <ArenaPlayerColumn
          participant={playerTwo}
          displayName={
            playerTwo ? (usernames.get(playerTwo.userId) ?? "Player 2") : "Awaiting Opponent"
          }
          isWinner={Boolean(activeResolution && playerTwo && activeResolution.winnerId === playerTwo.userId)}
          spinning={spinning && arenaPhase === "opening"}
          carouselCards={previewStrip}
          showCarousel={arenaPhase === "opening" && openingRound < battle.boxIds.length}
          pulls={playerTwoResult?.pulls ?? []}
          runningTotal={
            playerTwoResult?.totalPulledValue ?? playerTwo?.totalPulledValue ?? 0
          }
          statusLabel={
            arenaPhase === "opening"
              ? "Unboxing…"
              : battle.status === "waiting"
                ? "Open Slot"
                : "Ready"
          }
        />
      </div>

      {arenaPhase === "completed" && activeResolution ? (
        <section className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF007F]">
            Final Result
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">
            {usernames.get(activeResolution.winnerId) ?? "Winner"} takes the pool
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            {formatGems(activeResolution.winnerTotal)} total pull value · all items vaulted to the
            winner&apos;s locker.
          </p>
        </section>
      ) : null}

      <p className="text-center text-[10px] leading-relaxed text-muted">
        Outcomes are rolled securely on the server when the creator finalizes the battle. Both
        players share the same synchronized opening sequence.
      </p>
    </div>
  );
}
