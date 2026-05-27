const CLIENT_SEED_KEY = "winrips.clientSeed";
const LOCAL_SERVER_SEED_KEY_PREFIX = "winrips.localServerSeed";

export interface FairnessSession {
  packId: string;
  /** Display label when packId is an audit reference. */
  packName?: string;
  clientSeed: string;
  nonce: number;
  /** SHA-256 hash shown before the roll. */
  serverSeedHash: string;
  /** Revealed after the roll for user verification. */
  serverSeed?: string;
  /** SHA-512 proof hash combining seed + roll inputs. */
  proofHash?: string;
  /** Backwards-compatible alias used by existing UI surfaces. */
  commitmentHash: string;
  sessionId?: string;
  rolledNumber?: number;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(bytes = 32): string {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function shaHex(algorithm: "SHA-256" | "SHA-512", input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest(algorithm, encoded);
  return toHex(digest);
}

async function sha256Hex(input: string): Promise<string> {
  return shaHex("SHA-256", input);
}

async function sha512Hex(input: string): Promise<string> {
  return shaHex("SHA-512", input);
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

function localServerSeedStorageKey(packId: string, nonce: number): string {
  return `${LOCAL_SERVER_SEED_KEY_PREFIX}.${packId}.${nonce}`;
}

function cacheLocalServerSeed(packId: string, nonce: number, seed: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(localServerSeedStorageKey(packId, nonce), seed);
  } catch {
    /* ignore */
  }
}

function consumeLocalServerSeed(packId: string, nonce: number): string | undefined {
  if (typeof window === "undefined") return undefined;
  const key = localServerSeedStorageKey(packId, nonce);
  try {
    const value = window.sessionStorage.getItem(key) ?? undefined;
    window.sessionStorage.removeItem(key);
    return value?.trim() || undefined;
  } catch {
    return undefined;
  }
}

async function computeProofHash(input: {
  serverSeed: string;
  packId: string;
  clientSeed: string;
  nonce: number;
  rolledNumber?: number;
}): Promise<string> {
  const payload = [
    input.serverSeed,
    input.clientSeed,
    String(input.nonce),
    input.packId,
    input.rolledNumber != null ? input.rolledNumber.toFixed(6) : "pending",
  ].join(":");
  return sha512Hex(payload);
}

interface CreateFairnessSessionResponse {
  sessionId: string;
  serverSeedHash: string;
}

interface RevealFairnessSessionResponse {
  serverSeed: string;
}

async function createServerSession(
  packId: string,
): Promise<{ sessionId: string; serverSeedHash: string } | null> {
  if (typeof window === "undefined") return null;
  const response = await fetch("/api/fairness/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", packId }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as Partial<CreateFairnessSessionResponse>;
  if (typeof payload.sessionId !== "string" || typeof payload.serverSeedHash !== "string") {
    return null;
  }
  return {
    sessionId: payload.sessionId,
    serverSeedHash: payload.serverSeedHash,
  };
}

async function revealServerSeed(
  sessionId: string,
): Promise<{ serverSeed: string } | null> {
  if (typeof window === "undefined") return null;
  const response = await fetch("/api/fairness/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reveal", sessionId }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as Partial<RevealFairnessSessionResponse>;
  if (typeof payload.serverSeed !== "string" || !payload.serverSeed.trim()) return null;
  return { serverSeed: payload.serverSeed.trim() };
}

export async function buildPendingFairnessSession(packId: string): Promise<FairnessSession> {
  const clientSeed = getOrCreateClientSeed();
  const nonce = readSessionNonce(packId) + 1;
  const remote = await createServerSession(packId).catch(() => null);
  if (remote) {
    return {
      packId,
      clientSeed,
      nonce,
      sessionId: remote.sessionId,
      serverSeedHash: remote.serverSeedHash,
      commitmentHash: remote.serverSeedHash,
    };
  }

  const localServerSeed = randomHex(32);
  cacheLocalServerSeed(packId, nonce, localServerSeed);
  const serverSeedHash = await sha256Hex(localServerSeed);
  return {
    packId,
    clientSeed,
    nonce,
    serverSeedHash,
    commitmentHash: serverSeedHash,
  };
}

export async function commitFairnessSession(
  packId: string,
  rolledNumber: number,
  pendingSession?: FairnessSession | null,
): Promise<FairnessSession> {
  const clientSeed = getOrCreateClientSeed();
  const nonce = incrementSessionNonce(packId);

  let serverSeed: string | undefined;
  let serverSeedHash: string | undefined;
  let sessionId: string | undefined;

  if (pendingSession?.packId === packId && pendingSession.nonce === nonce) {
    sessionId = pendingSession.sessionId;
    serverSeedHash = pendingSession.serverSeedHash;
  }

  if (sessionId) {
    const revealed = await revealServerSeed(sessionId).catch(() => null);
    serverSeed = revealed?.serverSeed;
  }

  if (!serverSeed) {
    serverSeed = consumeLocalServerSeed(packId, nonce);
  }

  if (!serverSeed) {
    serverSeed = randomHex(32);
  }

  const resolvedServerSeedHash = serverSeedHash ?? (await sha256Hex(serverSeed));
  const proofHash = await computeProofHash({
    serverSeed,
    packId,
    clientSeed,
    nonce,
    rolledNumber: Math.max(0, rolledNumber),
  });

  return {
    packId,
    clientSeed,
    nonce,
    serverSeed,
    serverSeedHash: resolvedServerSeedHash,
    proofHash,
    commitmentHash: resolvedServerSeedHash,
    sessionId,
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
  const derivedServerSeed = `history_seed_${input.entryId}`;
  const serverSeedHash = await sha256Hex(derivedServerSeed);
  const proofHash = await computeProofHash({
    serverSeed: derivedServerSeed,
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
    serverSeedHash,
    proofHash,
    commitmentHash: serverSeedHash,
    rolledNumber: input.rolledNumber,
  };
}
