import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBattleRecord,
  fetchTopBattlers,
  type BattleRecord,
} from "../lib/packBattleLogic";
import { queryKeys } from "./queryKeys";

/** Show cached W/L instantly; refresh in background after this window. */
export const BATTLE_RECORD_STALE_MS = 5 * 60 * 1000;

const EMPTY_RECORD: BattleRecord = { wins: 0, losses: 0 };

export function useBattleRecord(userId: string | undefined) {
  const trimmed = userId?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.battleRecord(trimmed),
    queryFn: () => fetchBattleRecord(trimmed),
    enabled: Boolean(trimmed),
    staleTime: BATTLE_RECORD_STALE_MS,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useTopBattlers(limit: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.topBattlers(limit),
    queryFn: () => fetchTopBattlers(limit),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useSetBattleRecordCache() {
  const queryClient = useQueryClient();

  return (userId: string, record: BattleRecord) => {
    const trimmed = userId.trim();
    if (!trimmed) return;
    queryClient.setQueryData(queryKeys.battleRecord(trimmed), record);
  };
}

export function battleRecordFromQuery(
  data: BattleRecord | undefined,
  isPending: boolean,
): { record: BattleRecord; showSkeleton: boolean } {
  return {
    record: data ?? EMPTY_RECORD,
    showSkeleton: isPending && data === undefined,
  };
}
