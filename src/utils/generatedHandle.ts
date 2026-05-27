const ADJECTIVES = [
  "strangely",
  "quietly",
  "boldly",
  "swiftly",
  "calmly",
  "wildly",
  "oddly",
  "brightly",
] as const;

const NOUNS = [
  "above-monitor",
  "vault-keeper",
  "pack-hunter",
  "card-finder",
  "slab-collector",
  "drop-chaser",
  "rip-master",
  "gem-stacker",
] as const;

/** Deterministic display handle when profile username is unset. */
export function generatedHandleFromUserId(userId: string): string {
  if (!userId) return "anonymous-collector";
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  const adj = ADJECTIVES[hash % ADJECTIVES.length]!;
  const noun = NOUNS[(hash >> 4) % NOUNS.length]!;
  return `${adj}-${noun}`;
}
