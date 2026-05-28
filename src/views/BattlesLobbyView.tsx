import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useBoxesCatalog } from "../context/BoxesCatalogContext";
import { CreateBattleModal } from "../components/battles/CreateBattleModal";
import { SessionAuthWall } from "../components/auth/SessionAuthWall";
import { CollectibleImage } from "../components/ui/CollectibleImage";
import { formatGems } from "../constants/retail";
import {
  createBattle,
  fetchWaitingBattles,
  type BattleLobbyItem,
} from "../lib/battleLogic";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import type { CatalogPack } from "../types/box";

const MAX_BATTLE_PLAYERS = 2;

const PAGE_SHELL =
  "mx-auto w-full max-w-[1600px] space-y-8 overflow-x-hidden px-4 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-4 lg:px-8";

function formatBoxNames(boxIds: string[], packsById: Map<string, CatalogPack>): string {
  const names = boxIds
    .map((boxId) => packsById.get(boxId)?.name ?? boxId)
    .filter(Boolean);

  if (names.length === 0) return "Unknown boxes";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} + ${names[1]}`;
  return `${names[0]} + ${names.length - 1} more`;
}

function PlayerSlotRow({ filled }: { filled: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: MAX_BATTLE_PLAYERS }).map((_, index) => (
        <span
          key={index}
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-bold ${
            index < filled
              ? "border-[#FF007F]/40 bg-[#FF007F]/15 text-[#FF007F]"
              : "border-white/10 bg-[#0A0A0C] text-transparent"
          }`}
          aria-hidden={index >= filled}
        >
          {index < filled ? "●" : ""}
        </span>
      ))}
      <span className="ml-1 text-xs tabular-nums text-muted">
        {filled}/{MAX_BATTLE_PLAYERS}
      </span>
    </div>
  );
}

function BattleLobbyCard({
  battle,
  packsById,
  onEnter,
}: {
  battle: BattleLobbyItem;
  packsById: Map<string, CatalogPack>;
  onEnter: (battleId: string) => void;
}) {
  const filled = battle.participants.length;
  const primaryBoxId = battle.boxIds[0];
  const primaryPack = primaryBoxId ? packsById.get(primaryBoxId) : undefined;
  const boxLabel = formatBoxNames(battle.boxIds, packsById);

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-[#121318]/90 transition-colors hover:border-white/20">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0A0A0C] p-2">
            {primaryPack ? (
              <CollectibleImage
                src={primaryPack.image}
                alt={primaryPack.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                PvP
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF007F]">
              Waiting for players
            </p>
            <h3 className="mt-1 truncate text-base font-bold text-white">{boxLabel}</h3>
            <p className="mt-1 text-xs text-muted">
              {battle.boxIds.length}{" "}
              {battle.boxIds.length === 1 ? "box" : "boxes"} ·{" "}
              <span className="font-semibold text-amber-400/90">
                {formatGems(battle.entryCost)} entry
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <PlayerSlotRow filled={filled} />
          <button
            type="button"
            onClick={() => onEnter(battle.id)}
            className="rounded-lg border border-[#FF007F]/30 bg-[#FF007F]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#FF007F] transition-all hover:shadow-[0_0_15px_rgba(255,0,127,0.35)]"
          >
            {filled < MAX_BATTLE_PLAYERS ? "Join Battle" : "View Battle"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function BattlesLobbyView() {
  const { isLoggedIn, userId, setGoldVolts, showCashoutToast, openAuthModal, navigateToBattle } =
    useApp();
  const { user, authLoading, isAuthenticated } = useAuth();
  const { packs, loading: catalogLoading } = useBoxesCatalog();

  const [battles, setBattles] = useState<BattleLobbyItem[]>([]);
  const [battlesLoading, setBattlesLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creatingBattle, setCreatingBattle] = useState(false);

  const hasBattleAccess =
    !authLoading &&
    isAuthenticated &&
    Boolean(user?.id) &&
    isLoggedIn &&
    Boolean(userId) &&
    user!.id === userId;

  const packsById = useMemo(() => new Map(packs.map((pack) => [pack.id, pack])), [packs]);

  const loadBattles = useCallback(async () => {
    setBattlesLoading(true);
    try {
      const rows = await fetchWaitingBattles();
      setBattles(rows);
    } finally {
      setBattlesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBattles();
  }, [loadBattles]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const client = supabase;

    const channel = client
      .channel("battles-lobby")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "battles" },
        () => {
          void loadBattles();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "battle_participants" },
        () => {
          void loadBattles();
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [loadBattles]);

  async function handleCreateBattle(boxIds: string[]) {
    if (!hasBattleAccess) {
      openAuthModal("login");
      return;
    }

    setCreatingBattle(true);
    try {
      const result = await createBattle(boxIds);
      if (!result.ok) {
        showCashoutToast(result.error);
        return;
      }

      setGoldVolts(result.gemsBalance);
      setCreateModalOpen(false);
      showCashoutToast(`Battle created — ${formatGems(result.entryCost)} entry locked in.`);
      await loadBattles();
      navigateToBattle(result.battleId);
    } finally {
      setCreatingBattle(false);
    }
  }

  function handleOpenCreateModal() {
    if (!hasBattleAccess) {
      openAuthModal("login");
      return;
    }
    setCreateModalOpen(true);
  }

  return (
    <div className={PAGE_SHELL}>
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF007F]">
            PvP Multiplayer
          </p>
          <h1 className="mt-2 text-xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Box Battles
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            Create a battle lobby, lock in your entry fee, and wait for a rival to join the
            1v1 rip-off.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="shrink-0 rounded-lg bg-[#FF007F] px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition-all hover:brightness-110"
        >
          Create Battle
        </button>
      </header>

      {authLoading ? (
        <p className="py-16 text-center text-sm text-muted">Verifying session…</p>
      ) : !hasBattleAccess ? (
        <SessionAuthWall description="Sign in to create battles and compete against other collectors in live PvP lobbies." />
      ) : (
        <section aria-labelledby="active-battles-heading">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2
              id="active-battles-heading"
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted"
            >
              Active Lobbies
            </h2>
            <p className="text-sm text-muted">
              <span className="font-semibold tabular-nums text-white">{battles.length}</span>{" "}
              waiting
            </p>
          </div>

          {battlesLoading ? (
            <p className="py-16 text-center text-sm text-muted">Loading active battles…</p>
          ) : battles.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#121318]/90 py-16 text-center">
              <p className="text-base font-semibold text-white">No battles waiting right now</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Be the first to create a lobby and challenge other collectors.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-6 text-sm font-semibold text-[#FF007F] transition-colors hover:underline"
              >
                Create the first battle
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {battles.map((battle) => (
                <BattleLobbyCard
                  key={battle.id}
                  battle={battle}
                  packsById={packsById}
                  onEnter={(id) => navigateToBattle(id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <CreateBattleModal
        open={createModalOpen}
        packs={packs}
        loading={catalogLoading}
        creating={creatingBattle}
        onClose={() => setCreateModalOpen(false)}
        onCreate={(boxIds) => void handleCreateBattle(boxIds)}
      />
    </div>
  );
}
