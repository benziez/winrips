const PENDING_BATTLE_PACK_ID_KEY = "winrips.pendingBattlePackId";

export function setPendingBattlePackId(packId: string): void {
  if (typeof window === "undefined") return;
  const normalized = packId.trim();
  if (!normalized) return;
  window.sessionStorage.setItem(PENDING_BATTLE_PACK_ID_KEY, normalized);
}

export function consumePendingBattlePackId(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(PENDING_BATTLE_PACK_ID_KEY);
  window.sessionStorage.removeItem(PENDING_BATTLE_PACK_ID_KEY);
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}
