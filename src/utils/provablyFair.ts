const CLIENT_SEED_KEY = "winrips.clientSeed";

export interface FairnessSession {
  packId: string;
  /** Display label when packId is an audit reference. */
  packName?: string;
  clientSeed: string;
  nonce: number;
  /** HMAC-SHA512 commitment shown before and after the roll. */
  commitmentHash: string;
  rolledNumber?: number;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getOrCreateClientSeed(): string {
  if (typeof window === "undefined") return "player_session";

  try {
    const existing = window.localStorage.getItem(CLIENT_SEED_KEY);
    if (existing?.trim()) return existing;

    const seed = `player_${crypto.randomUUID()}`;
    window.localStorage.setItem(CLIENT_SEED_KEY, seed);
    return seed;
  } catch {
    return "player_session";
  }
}

function sessionNonceKey(packId: string): string {
  return `winrips.nonce.${packId}`;
}

function readSessionNonce(packId: string): number {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem(sessionNonceKey(packId));
    const current = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(current) ? current : 0;
  } catch {
    return 0;
  }
}

function incrementSessionNonce(packId: string): number {
  const next = readSessionNonce(packId) + 1;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(sessionNonceKey(packId), String(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}

function serverSeedForSession(packId: string, nonce: number): string {
  return `winrips_srv_${packId}_${nonce}`;
}

export async function computeFairnessCommitment(input: {
  packId: string;
  clientSeed: string;
  nonce: number;
  rolledNumber?: number;
}): Promise<string> {
  const serverSeed = serverSeedForSession(input.packId, input.nonce);
  const payload = [
    serverSeed,
    input.clientSeed,
    String(input.nonce),
    input.packId,
    input.rolledNumber != null ? input.rolledNumber.toFixed(6) : "pending",
  ].join(":");

  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(serverSeed);
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(signature);
}

export async function buildPendingFairnessSession(packId: string): Promise<FairnessSession> {
  const clientSeed = getOrCreateClientSeed();
  const nonce = readSessionNonce(packId) + 1;
  const commitmentHash = await computeFairnessCommitment({
    packId,
    clientSeed,
    nonce,
  });

  return {
    packId,
    clientSeed,
    nonce,
    commitmentHash,
  };
}

export async function commitFairnessSession(
  packId: string,
  rolledNumber: number,
): Promise<FairnessSession> {
  const clientSeed = getOrCreateClientSeed();
  const nonce = incrementSessionNonce(packId);
  const commitmentHash = await computeFairnessCommitment({
    packId,
    clientSeed,
    nonce,
    rolledNumber,
  });

  return {
    packId,
    clientSeed,
    nonce,
    commitmentHash,
    rolledNumber,
  };
}

/** Stable audit hash for a logged play-history row. */
export async function buildHistoryAuditSession(input: {
  packName: string;
  entryId: string;
  rolledNumber: number;
}): Promise<FairnessSession> {
  const clientSeed = getOrCreateClientSeed();
  const packId = `history:${input.entryId}`;
  const commitmentHash = await computeFairnessCommitment({
    packId,
    clientSeed,
    nonce: Math.round(input.rolledNumber * 1000),
    rolledNumber: input.rolledNumber,
  });

  return {
    packId,
    packName: input.packName,
    clientSeed,
    nonce: Math.round(input.rolledNumber * 1000),
    commitmentHash,
    rolledNumber: input.rolledNumber,
  };
}
