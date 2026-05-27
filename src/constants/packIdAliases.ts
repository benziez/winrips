/** Supabase / lobby id aliases — keep free of catalog imports to avoid cycles. */
export const PACK_ID_ALIASES: Record<string, string> = {
  "1999-god": "god-pack-1999",
  "151-booster": "151-booster-collector",
};

export function normalizePackId(packId: string): string {
  const trimmed = packId.trim();
  return PACK_ID_ALIASES[trimmed] ?? trimmed;
}
