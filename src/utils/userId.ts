const STORAGE_KEY = "winrips-user-id";

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "server";

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = `u_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
