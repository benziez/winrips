import { LOBBY_PACK_CATALOG } from "../constants/packs";

export type BattleRoomStatus = "waiting" | "live" | "full";

export interface BattlePlayer {
  id: string;
  name: string;
  /** Simulated running total of unboxed value */
  totalValue: number;
  pulls: { name: string; value: number }[];
}

export interface BattleRoom {
  id: string;
  packId: string;
  packName: string;
  packImage: string;
  maxPlayers: number;
  players: BattlePlayer[];
  rounds: number;
  entryFeePerPlayer: number;
  status: BattleRoomStatus;
}

function packById(id: string) {
  return LOBBY_PACK_CATALOG.find((p) => p.id === id) ?? LOBBY_PACK_CATALOG[0];
}

export const MOCK_BATTLE_ROOMS: BattleRoom[] = [
  {
    id: "battle-101",
    packId: "legendary-hunt",
    packName: packById("legendary-hunt").name,
    packImage: packById("legendary-hunt").image,
    maxPlayers: 2,
    rounds: 3,
    entryFeePerPlayer: 2_500,
    status: "waiting",
    players: [
      { id: "p1", name: "VaultKing92", totalValue: 0, pulls: [] },
    ],
  },
  {
    id: "battle-102",
    packId: "151-booster-collector",
    packName: packById("151-booster-collector").name,
    packImage: packById("151-booster-collector").image,
    maxPlayers: 4,
    rounds: 3,
    entryFeePerPlayer: 1_000,
    status: "live",
    players: [
      {
        id: "p1",
        name: "NeonRipper",
        totalValue: 4_200,
        pulls: [
          { name: "Mew ex", value: 2_800 },
          { name: "Charizard ex", value: 1_400 },
        ],
      },
      {
        id: "p2",
        name: "SlabHunter",
        totalValue: 6_150,
        pulls: [
          { name: "Umbreon VMAX", value: 4_200 },
          { name: "Pikachu VMAX", value: 1_950 },
        ],
      },
      { id: "p3", name: "GemWhale", totalValue: 0, pulls: [] },
    ],
  },
  {
    id: "battle-103",
    packId: "god-pack-1999",
    packName: packById("god-pack-1999").name,
    packImage: packById("god-pack-1999").image,
    maxPlayers: 4,
    rounds: 5,
    entryFeePerPlayer: 10_000,
    status: "waiting",
    players: [
      { id: "p1", name: "BaseSetOG", totalValue: 0, pulls: [] },
      { id: "p2", name: "ChaseCardX", totalValue: 0, pulls: [] },
    ],
  },
  {
    id: "battle-104",
    packId: "trainers-starter",
    packName: packById("trainers-starter").name,
    packImage: packById("trainers-starter").image,
    maxPlayers: 2,
    rounds: 1,
    entryFeePerPlayer: 100,
    status: "full",
    players: [
      { id: "p1", name: "StarterPull", totalValue: 0, pulls: [] },
      { id: "p2", name: "PackFiend", totalValue: 0, pulls: [] },
    ],
  },
];

export function getBattleRoom(id: string): BattleRoom | undefined {
  return MOCK_BATTLE_ROOMS.find((r) => r.id === id);
}

export function totalBattlePool(room: BattleRoom): number {
  return room.entryFeePerPlayer * room.maxPlayers * room.rounds;
}

export function totalEntryFee(room: BattleRoom): number {
  return room.entryFeePerPlayer * room.rounds;
}
