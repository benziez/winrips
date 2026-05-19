import { useEffect, useMemo, useState } from "react";
import {
  getBattleRoom,
  MOCK_BATTLE_ROOMS,
  totalBattlePool,
  totalEntryFee,
  type BattlePlayer,
  type BattleRoom,
} from "../data/battleRooms";
import { formatGems } from "../constants/retail";
import { CollectibleImage } from "../components/ui/CollectibleImage";

function PlayerSlots({
  filled,
  max,
}: {
  filled: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-bold uppercase ${
            i < filled
              ? "border-[#FF007F]/40 bg-[#FF007F]/15 text-[#FF007F]"
              : "border-[#2A2D34] bg-[#0A0A0C] text-[#4B5563]"
          }`}
          title={i < filled ? "Collector joined" : "Open slot"}
        >
          {i < filled ? "●" : ""}
        </span>
      ))}
      <span className="ml-1.5 text-xs tabular-nums text-[#A0A5B5]">
        {filled}/{max}
      </span>
    </div>
  );
}

function BattleLobbyRow({
  room,
  onView,
  onJoin,
}: {
  room: BattleRoom;
  onView: () => void;
  onJoin: () => void;
}) {
  const filled = room.players.length;
  const canJoin = room.status === "waiting" && filled < room.maxPlayers;
  const pool = totalBattlePool(room);
  const perPlayer = totalEntryFee(room);

  return (
    <tr className="border-b border-[#2A2D34]/80 transition-colors last:border-0 hover:bg-[#1A1C20]/60">
      <td className="px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#2A2D34] bg-[#0A0A0C] p-1">
            <CollectibleImage
              src={room.packImage}
              alt={room.packName}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{room.packName}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#A0A5B5]">
              {room.rounds} {room.rounds === 1 ? "Round" : "Rounds"} ·{" "}
              <span
                className={
                  room.status === "live"
                    ? "text-emerald-400"
                    : room.status === "full"
                      ? "text-amber-400"
                      : "text-[#FF007F]"
                }
              >
                {room.status === "live"
                  ? "Live"
                  : room.status === "full"
                    ? "Full"
                    : "Open"}
              </span>
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-4 sm:table-cell">
        <PlayerSlots filled={filled} max={room.maxPlayers} />
      </td>
      <td className="px-4 py-4 text-right">
        <p className="text-sm font-bold tabular-nums text-white">{formatGems(perPlayer)}</p>
        <p className="mt-0.5 text-[10px] text-[#A0A5B5]">Pool {formatGems(pool)}</p>
      </td>
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={canJoin ? onJoin : onView}
          className="rounded-md border border-[#2A2D34] bg-[#1A1C20] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:border-[#FF007F]/40 hover:text-[#FF007F]"
        >
          {canJoin ? "Join Room" : "View Battle"}
        </button>
      </td>
    </tr>
  );
}

function ArenaPlayerColumn({
  slotIndex,
  player,
  isLive,
}: {
  slotIndex: number;
  player: BattlePlayer | null;
  maxPlayers: number;
  isLive: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-[#2A2D34] bg-[#121318]">
      <div className="border-b border-[#2A2D34] px-3 py-2.5">
        {player ? (
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#FF007F]/30 bg-[#FF007F]/10 text-[10px] font-bold text-[#FF007F]">
              {player.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">{player.name}</p>
              <p className="text-[10px] text-[#A0A5B5]">Collector {slotIndex + 1}</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#4B5563]">
            Awaiting Collector
          </p>
        )}
      </div>

      <div className="flex min-h-[140px] flex-1 items-center justify-center border-b border-[#2A2D34] bg-[#0A0A0C] p-4 sm:min-h-[180px]">
        <div className="flex h-full w-full max-w-[120px] flex-col items-center justify-center rounded-lg border border-dashed border-[#2A2D34] bg-[#111115] px-3 py-6 text-center">
          <span className="text-2xl opacity-40" aria-hidden>
            📦
          </span>
          <p className="mt-2 text-[9px] font-semibold uppercase tracking-widest text-[#4B5563]">
            {isLive && player ? "Carousel Active" : "Pack Slot"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#A0A5B5]">
            Running Total
          </span>
          <span className="text-sm font-bold tabular-nums text-white">
            {formatGems(player?.totalValue ?? 0)}
          </span>
        </div>
        <ul className="max-h-24 space-y-1 overflow-y-auto">
          {(player?.pulls ?? []).length === 0 ? (
            <li className="text-[10px] text-[#4B5563]">No pulls yet</li>
          ) : (
            player?.pulls.map((pull, i) => (
              <li
                key={`${pull.name}-${i}`}
                className="flex items-center justify-between gap-2 text-[10px]"
              >
                <span className="truncate text-[#A0A5B5]">{pull.name}</span>
                <span className="shrink-0 font-semibold tabular-nums text-gold">
                  {formatGems(pull.value)}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function BattleArena({
  room,
  onBack,
}: {
  room: BattleRoom;
  onBack: () => void;
}) {
  const [liveRoom, setLiveRoom] = useState(room);
  const pool = totalBattlePool(liveRoom);
  const entry = totalEntryFee(liveRoom);
  const isWaiting = liveRoom.status === "waiting";
  const statusLabel = isWaiting
    ? "WAITING FOR COLLECTORS..."
    : liveRoom.status === "live"
      ? "BATTLE IN PROGRESS"
      : "ROOM FULL — STARTING SOON";

  useEffect(() => {
    setLiveRoom(room);
  }, [room.id]);

  useEffect(() => {
    if (liveRoom.status !== "live") return;

    const interval = setInterval(() => {
      setLiveRoom((prev) => ({
        ...prev,
        players: prev.players.map((p) => {
          if (Math.random() > 0.35) return p;
          const bump = Math.floor(Math.random() * 800) + 200;
          const pull = { name: `Pull #${p.pulls.length + 1}`, value: bump };
          return {
            ...p,
            totalValue: p.totalValue + bump,
            pulls: [...p.pulls, pull],
          };
        }),
      }));
    }, 2800);

    return () => clearInterval(interval);
  }, [liveRoom.status, liveRoom.id]);

  const slots = useMemo(() => {
    const cols: (BattlePlayer | null)[] = Array.from(
      { length: liveRoom.maxPlayers },
      () => null,
    );
    liveRoom.players.forEach((p, i) => {
      if (i < cols.length) cols[i] = p;
    });
    return cols;
  }, [liveRoom.maxPlayers, liveRoom.players]);

  return (
    <div className="mx-auto w-full max-w-[1600px] overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-xs text-[#A0A5B5] transition-colors hover:text-[#FF007F]"
      >
        ← Back to Battles Lobby
      </button>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-[#2A2D34] bg-[#1A1C20] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF007F]">
            {statusLabel}
          </p>
          <h1 className="mt-1 text-lg font-bold text-white sm:text-xl">{liveRoom.packName}</h1>
        </div>
        <div className="flex flex-wrap gap-6 sm:gap-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
              Rounds
            </p>
            <p className="text-sm font-bold text-white">{liveRoom.rounds} Rounds</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
              Entry Fee
            </p>
            <p className="text-sm font-bold tabular-nums text-white">{formatGems(entry)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A5B5]">
              Battle Pool
            </p>
            <p className="text-sm font-bold tabular-nums text-gold">{formatGems(pool)}</p>
          </div>
        </div>
      </div>

      <div
        className={`grid gap-3 ${
          liveRoom.maxPlayers <= 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {slots.map((player, i) => (
          <ArenaPlayerColumn
            key={i}
            slotIndex={i}
            player={player}
            maxPlayers={liveRoom.maxPlayers}
            isLive={liveRoom.status === "live"}
          />
        ))}
      </div>

      <p className="mt-8 text-center text-[10px] leading-relaxed text-[#6B7280]">
        Multiplayer outcomes are individual, strictly synchronized, and mathematically validated
        utilizing our standard unified Provably Fair cryptographic framework.
      </p>
    </div>
  );
}

function BattlesLobby({
  onCreate,
  onEnterRoom,
}: {
  onCreate: () => void;
  onEnterRoom: (id: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[1600px] overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-[#2A2D34] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
            PvP Box Battles
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#A0A5B5]">
            Create or join real-time unboxing rooms. Highest total asset value sweeps the entire
            lobby pool.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="shrink-0 rounded-md bg-[#FF007F] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#FF007F]/90"
        >
          + Create New Battle
        </button>
      </header>

      <section className="overflow-hidden rounded-xl border border-[#2A2D34] bg-[#121318]">
        <div className="border-b border-[#2A2D34] px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Active Rooms</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#2A2D34] text-[10px] font-bold uppercase tracking-wider text-[#A0A5B5]">
                <th className="px-4 py-3">Battle Details</th>
                <th className="hidden px-4 py-3 sm:table-cell">Player Slots</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_BATTLE_ROOMS.map((room) => (
                <BattleLobbyRow
                  key={room.id}
                  room={room}
                  onView={() => onEnterRoom(room.id)}
                  onJoin={() => onEnterRoom(room.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function BattlesView() {
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);

  const activeRoom = activeBattleId ? getBattleRoom(activeBattleId) : undefined;

  function handleCreate() {
    const open = MOCK_BATTLE_ROOMS.find(
      (r) => r.status === "waiting" && r.players.length < r.maxPlayers,
    );
    if (open) setActiveBattleId(open.id);
  }

  if (activeRoom) {
    return <BattleArena room={activeRoom} onBack={() => setActiveBattleId(null)} />;
  }

  return (
    <BattlesLobby onCreate={handleCreate} onEnterRoom={(id) => setActiveBattleId(id)} />
  );
}
