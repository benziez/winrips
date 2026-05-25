export const queryKeys = {
  vault: (userId: string) => ["vault", userId] as const,
  vaultAll: ["vault"] as const,
  user: (userId: string) => ["user", userId] as const,
  userAll: ["user"] as const,
};
