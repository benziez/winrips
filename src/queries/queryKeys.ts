export const queryKeys = {
  vault: (userId: string) => ["vault", userId] as const,
  vaultAll: ["vault"] as const,
  user: (userId: string) => ["user", userId] as const,
  userAll: ["user"] as const,
  battleRecord: (userId: string) => ["battle-record", userId] as const,
  battleRecordAll: ["battle-record"] as const,
  topBattlers: (limit: number) => ["top-battlers", limit] as const,
  topBattlersAll: ["top-battlers"] as const,
};
