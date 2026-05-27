import { createHash, randomBytes, randomUUID } from "node:crypto";

interface StoredSeed {
  packId: string;
  serverSeed: string;
  serverSeedHash: string;
  createdAtMs: number;
}

const TTL_MS = 30 * 60 * 1000;
const seedStore = new Map<string, StoredSeed>();

function nowMs(): number {
  return Date.now();
}

function pruneExpiredSeeds(): void {
  const cutoff = nowMs() - TTL_MS;
  for (const [id, entry] of seedStore.entries()) {
    if (entry.createdAtMs < cutoff) {
      seedStore.delete(id);
    }
  }
}

function hashSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

export function createFairnessSeedSession(packId: string): { sessionId: string; serverSeedHash: string } {
  pruneExpiredSeeds();
  const sessionId = randomUUID();
  const serverSeed = randomBytes(32).toString("hex");
  const serverSeedHash = hashSeed(serverSeed);
  seedStore.set(sessionId, {
    packId,
    serverSeed,
    serverSeedHash,
    createdAtMs: nowMs(),
  });
  return { sessionId, serverSeedHash };
}

export function revealFairnessSeedSession(
  sessionId: string,
): { serverSeed: string; serverSeedHash: string; packId: string } | null {
  pruneExpiredSeeds();
  const session = seedStore.get(sessionId);
  if (!session) return null;
  seedStore.delete(sessionId);
  return {
    serverSeed: session.serverSeed,
    serverSeedHash: session.serverSeedHash,
    packId: session.packId,
  };
}
