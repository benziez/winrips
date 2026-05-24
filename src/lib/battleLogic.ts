import { RETAIL_COPY } from "../constants/retail";
import type { Database, Json } from "../types/database";
import { logger } from "./logger";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type BattleStatus = "waiting" | "in_progress" | "completed";

export interface BattleParticipant {
  id: string;
  battleId: string;
  userId: string;
  position: number;
  totalPulledValue: number;
  joinedAt: string;
}

export interface BattlePull {
  boxId: string;
  itemId: string;
  itemName: string;
  storeRarity: string;
  gemValue: number;
  imageUrl: string;
}

export interface BattleParticipantResult {
  userId: string;
  position: number;
  totalPulledValue: number;
  pulls: BattlePull[];
}

export interface BattleResolution {
  winnerId: string;
  winnerTotal: number;
  standings: BattleParticipantResult[];
}

export interface BattleDetail {
  id: string;
  status: BattleStatus;
  boxIds: string[];
  entryCost: number;
  winnerId: string | null;
  createdAt: string;
  participants: BattleParticipant[];
  resolution: BattleResolution | null;
}

export interface BattleLobbyItem extends BattleDetail {}

type CreateBattleArgs = Database["public"]["Functions"]["create_battle"]["Args"];
type JoinBattleArgs = Database["public"]["Functions"]["join_battle"]["Args"];
type ResolveBattleArgs = Database["public"]["Functions"]["resolve_battle"]["Args"];

interface BattleRpcClient {
  rpc(
    fn: "create_battle",
    args: CreateBattleArgs,
  ): Promise<{ data: Json | null; error: { message: string } | null }>;
  rpc(
    fn: "join_battle",
    args: JoinBattleArgs,
  ): Promise<{ data: Json | null; error: { message: string } | null }>;
  rpc(
    fn: "resolve_battle",
    args: ResolveBattleArgs,
  ): Promise<{ data: Json | null; error: { message: string } | null }>;
}

export type CreateBattleResult =
  | { ok: true; battleId: string; entryCost: number; gemsBalance: number }
  | { ok: false; error: string };

export type JoinBattleResult =
  | { ok: true; battleId: string; position: number; gemsBalance: number; status: BattleStatus }
  | { ok: false; error: string };

export type ResolveBattleResult =
  | { ok: true; resolution: BattleResolution }
  | { ok: false; error: string };

interface CreateBattleRpcPayload {
  success?: boolean;
  battle_id?: string;
  entry_cost?: number;
  gems_balance?: number;
  status?: string;
}

interface JoinBattleRpcPayload {
  success?: boolean;
  battle_id?: string;
  position?: number;
  gems_balance?: number;
  status?: string;
}

interface BattleParticipantRow {
  id: string;
  battle_id: string;
  user_id: string;
  position: number;
  total_pulled_value: number;
  joined_at: string;
}

interface BattleRow {
  id: string;
  status: string;
  box_ids: string[];
  entry_cost: number;
  winner_id: string | null;
  created_at: string;
  results?: Json | null;
  battle_participants?: BattleParticipantRow[] | null;
}

interface BattlePullRow {
  box_id: string;
  item_id: string;
  item_name: string;
  store_rarity: string | null;
  gem_value: number;
  image_url: string | null;
  user_id?: string;
  position?: number;
}

interface BattleStandingRow {
  user_id?: string;
  position?: number;
  total_pulled_value?: number;
  pulls?: BattlePullRow[];
}

interface ResolveBattleRpcPayload {
  success?: boolean;
  winner_id?: string;
  winner_total?: number;
  standings?: BattleStandingRow[];
}

function mapBattleError(message: string, action: "create" | "join" | "resolve" = "create"): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("not_authenticated")) {
    return "Sign in to create or join battles.";
  }
  if (normalized.includes("insufficient_gems")) {
    return `Insufficient ${RETAIL_COPY.currency} for this battle.`;
  }
  if (normalized.includes("invalid_box_ids")) {
    return "One or more selected boxes are invalid. Refresh and try again.";
  }
  if (normalized.includes("profile_not_found")) {
    return "Account profile not found. Try signing out and back in.";
  }
  if (normalized.includes("battle_not_found")) {
    return "This battle no longer exists.";
  }
  if (normalized.includes("already_joined")) {
    return "You are already seated in this battle.";
  }
  if (normalized.includes("battle_full")) {
    return "This battle is already full.";
  }
  if (normalized.includes("battle_not_joinable")) {
    return "This battle is no longer accepting players.";
  }
  if (normalized.includes("not_battle_creator")) {
    return "Only the battle creator can finalize this match.";
  }
  if (normalized.includes("battle_not_in_progress")) {
    return "This battle is not ready to be resolved yet.";
  }
  if (normalized.includes("battle_not_ready")) {
    return "Both players must join before the battle can resolve.";
  }

  if (action === "join") {
    return "Unable to join this battle. Please try again.";
  }
  if (action === "resolve") {
    return "Unable to resolve this battle. Please try again.";
  }

  return "Unable to create this battle. Please try again.";
}

function rowToPull(row: BattlePullRow): BattlePull {
  return {
    boxId: row.box_id,
    itemId: row.item_id,
    itemName: row.item_name,
    storeRarity: row.store_rarity ?? "Common",
    gemValue: Math.round(Number(row.gem_value) || 0),
    imageUrl: row.image_url ?? "",
  };
}

function parseResolution(payload: ResolveBattleRpcPayload | Json | null): BattleResolution | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const data = payload as ResolveBattleRpcPayload;
  const winnerId = typeof data.winner_id === "string" ? data.winner_id : "";
  const winnerTotal = Number(data.winner_total);

  if (!winnerId || !Number.isFinite(winnerTotal)) return null;

  const standings = Array.isArray(data.standings)
    ? data.standings
        .map((standing) => {
          const userId = typeof standing.user_id === "string" ? standing.user_id : "";
          const position = Number(standing.position);
          const totalPulledValue = Number(standing.total_pulled_value);
          if (!userId || !Number.isFinite(position)) return null;

          const pulls = Array.isArray(standing.pulls)
            ? standing.pulls.map((pull) => rowToPull(pull as BattlePullRow))
            : [];

          return {
            userId,
            position: Math.round(position),
            totalPulledValue: Number.isFinite(totalPulledValue)
              ? Math.round(totalPulledValue)
              : pulls.reduce((sum, pull) => sum + pull.gemValue, 0),
            pulls,
          };
        })
        .filter((standing): standing is BattleParticipantResult => standing != null)
        .sort((a, b) => a.position - b.position)
    : [];

  return {
    winnerId,
    winnerTotal: Math.round(winnerTotal),
    standings,
  };
}

function rowToParticipant(row: BattleParticipantRow): BattleParticipant {
  return {
    id: row.id,
    battleId: row.battle_id,
    userId: row.user_id,
    position: row.position,
    totalPulledValue: row.total_pulled_value,
    joinedAt: row.joined_at,
  };
}

function rowToBattle(row: BattleRow): BattleDetail | null {
  if (
    row.status !== "waiting" &&
    row.status !== "in_progress" &&
    row.status !== "completed"
  ) {
    return null;
  }

  const participants = Array.isArray(row.battle_participants)
    ? row.battle_participants.map(rowToParticipant)
    : [];

  const resolution =
    row.status === "completed"
      ? parseResolution(row.results as ResolveBattleRpcPayload | null)
      : null;

  return {
    id: row.id,
    status: row.status,
    boxIds: Array.isArray(row.box_ids) ? row.box_ids : [],
    entryCost: row.entry_cost,
    winnerId: row.winner_id,
    createdAt: row.created_at,
    participants: participants.sort((a, b) => a.position - b.position),
    resolution,
  };
}

const BATTLE_SELECT =
  "id, status, box_ids, entry_cost, winner_id, created_at, results, battle_participants (id, battle_id, user_id, position, total_pulled_value, joined_at)";

/** Creates a new waiting battle and charges the creator's gem balance. */
export async function createBattle(boxIds: string[]): Promise<CreateBattleResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: "Box Battles require Supabase configuration." };
  }

  const normalizedBoxIds = boxIds.map((id) => id.trim()).filter(Boolean);
  if (normalizedBoxIds.length === 0) {
    return { ok: false, error: "Select at least one box for the battle." };
  }

  const args: CreateBattleArgs = { p_box_ids: normalizedBoxIds };
  const client = supabase as unknown as BattleRpcClient;
  const { data, error } = await client.rpc("create_battle", args);

  if (error) {
    logger.warn("[create_battle] RPC failed:", error.message);
    return { ok: false, error: mapBattleError(error.message, "create") };
  }

  const payload = data as CreateBattleRpcPayload | null;
  const battleId = typeof payload?.battle_id === "string" ? payload.battle_id : "";
  const entryCost = Number(payload?.entry_cost);
  const gemsBalance = Number(payload?.gems_balance);

  if (
    payload?.success !== true ||
    !battleId ||
    !Number.isFinite(entryCost) ||
    entryCost <= 0 ||
    !Number.isFinite(gemsBalance) ||
    gemsBalance < 0
  ) {
    return { ok: false, error: "Battle created but returned an invalid response." };
  }

  return {
    ok: true,
    battleId,
    entryCost: Math.round(entryCost),
    gemsBalance: Math.round(gemsBalance),
  };
}

/** Joins a waiting 1v1 battle as player 2. */
export async function joinBattle(battleId: string): Promise<JoinBattleResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: "Box Battles require Supabase configuration." };
  }

  const normalizedId = battleId.trim();
  if (!normalizedId) {
    return { ok: false, error: "Battle id is required." };
  }

  const client = supabase as unknown as BattleRpcClient;
  const { data, error } = await client.rpc("join_battle", { p_battle_id: normalizedId });

  if (error) {
    logger.warn("[join_battle] RPC failed:", error.message);
    return { ok: false, error: mapBattleError(error.message, "join") };
  }

  const payload = data as JoinBattleRpcPayload | null;
  const gemsBalance = Number(payload?.gems_balance);
  const position = Number(payload?.position);
  const status = payload?.status;

  if (
    payload?.success !== true ||
    !Number.isFinite(gemsBalance) ||
    gemsBalance < 0 ||
    !Number.isFinite(position) ||
    (status !== "in_progress" && status !== "waiting")
  ) {
    return { ok: false, error: "Joined battle but returned an invalid response." };
  }

  return {
    ok: true,
    battleId: normalizedId,
    position: Math.round(position),
    gemsBalance: Math.round(gemsBalance),
    status,
  };
}

/** Securely resolves an in-progress battle (creator only). */
export async function resolveBattle(battleId: string): Promise<ResolveBattleResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: "Box Battles require Supabase configuration." };
  }

  const normalizedId = battleId.trim();
  if (!normalizedId) {
    return { ok: false, error: "Battle id is required." };
  }

  const client = supabase as unknown as BattleRpcClient;
  const { data, error } = await client.rpc("resolve_battle", { p_battle_id: normalizedId });

  if (error) {
    logger.warn("[resolve_battle] RPC failed:", error.message);
    return { ok: false, error: mapBattleError(error.message, "resolve") };
  }

  const resolution = parseResolution(data);
  if (!resolution) {
    return { ok: false, error: "Battle resolved but returned an invalid response." };
  }

  return { ok: true, resolution };
}

/** Loads a single battle by id (any status). */
export async function fetchBattleById(battleId: string): Promise<BattleDetail | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const normalizedId = battleId.trim();
  if (!normalizedId) return null;

  const { data, error } = await supabase
    .from("battles")
    .select(BATTLE_SELECT)
    .eq("id", normalizedId)
    .maybeSingle();

  if (error) {
    logger.warn("[battles] fetch by id failed:", error.message);
    return null;
  }

  if (!data) return null;
  return rowToBattle(data as BattleRow);
}

/** Loads battles currently waiting for players. */
export async function fetchWaitingBattles(): Promise<BattleLobbyItem[]> {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await supabase
    .from("battles")
    .select(BATTLE_SELECT)
    .eq("status", "waiting")
    .order("created_at", { ascending: false });

  if (error) {
    logger.warn("[battles] fetch waiting failed:", error.message);
    return [];
  }

  if (!Array.isArray(data)) return [];

  return data
    .map((row) => rowToBattle(row as BattleRow))
    .filter((battle): battle is BattleLobbyItem => battle != null);
}

/** Loads display names for battle participants. */
export async function fetchBattleUsernames(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  const labels = new Map<string, string>();
  if (!isSupabaseConfigured() || !supabase || uniqueIds.length === 0) {
    return labels;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", uniqueIds);

  if (error || !Array.isArray(data)) return labels;

  for (const row of data as Array<{ id: string; username: string | null }>) {
    const id = typeof row.id === "string" ? row.id : "";
    const username = typeof row.username === "string" ? row.username.trim() : "";
    if (id) {
      labels.set(id, username || `Collector ${id.slice(0, 6)}`);
    }
  }

  for (const id of uniqueIds) {
    if (!labels.has(id)) {
      labels.set(id, `Collector ${id.slice(0, 6)}`);
    }
  }

  return labels;
}

/** Returns the creator (position 1) user id for a battle, if seated. */
export function getBattleCreatorId(battle: BattleDetail): string | null {
  return battle.participants.find((participant) => participant.position === 1)?.userId ?? null;
}

/** Whether the given user can join this battle as player 2. */
export function canJoinBattle(battle: BattleDetail, userId: string | null | undefined): boolean {
  if (!userId || battle.status !== "waiting") return false;
  if (battle.participants.some((participant) => participant.userId === userId)) return false;
  return battle.participants.length === 1;
}

/** Whether the given user is the battle creator. */
export function isBattleCreator(battle: BattleDetail, userId: string | null | undefined): boolean {
  if (!userId) return false;
  return getBattleCreatorId(battle) === userId;
}
