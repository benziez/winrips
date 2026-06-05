import { normalizePackId } from "./packIdAliases";

const GUEST_DEMO_SPIN_USED_KEY = "winrips_guest_demo_spin_used_packs";

function readUsedPackIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(GUEST_DEMO_SPIN_USED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0));
  } catch {
    return new Set();
  }
}

function writeUsedPackIds(ids: Set<string>): void {
  try {
    sessionStorage.setItem(GUEST_DEMO_SPIN_USED_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage unavailable */
  }
}

function normalizedPackKey(packId: string): string {
  return normalizePackId(packId.trim());
}

/** Whether the guest still has a free demo spin for this pack this session. */
export function isGuestDemoSpinAvailable(packId: string): boolean {
  if (!packId.trim()) return false;
  return !readUsedPackIds().has(normalizedPackKey(packId));
}

export function markGuestDemoSpinUsed(packId: string): void {
  if (!packId.trim()) return;
  const used = readUsedPackIds();
  used.add(normalizedPackKey(packId));
  writeUsedPackIds(used);
}
