import { Redis } from "@upstash/redis/cloudflare";

const STORE_KEY = "winrips:balances";
const DEFAULT_GEM_BALANCE = 0;

/**
 * TEMP DEBUG fallback — remove after confirming Vercel env injection works.
 * Uses KV REST credentials (not rediss:// KV_URL).
 */
const FORCE_KV_URL = "https://model-pegasus-131097.upstash.io";
const FORCE_KV_TOKEN =
  "gQAAAAAAAgAZAAIgcDIyM2IxYWQyODFmMGU0MjdlOGI2OGI2MWIwOGYxYzNjMA";

let redisClient: Redis | null = null;

function resolveKvCredentials(): { url: string; token: string } {
  const url =
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL ??
    (FORCE_KV_URL || undefined);

  const token =
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    (FORCE_KV_TOKEN || undefined);

  if (!url || !token) {
    throw new Error(
      "Missing KV credentials on Edge: set KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*) in Vercel env, or paste into FORCE_KV_* for this test.",
    );
  }

  return { url, token };
}

function getRedis(): Redis {
  if (!redisClient) {
    const { url, token } = resolveKvCredentials();

    console.log("DEBUG_KV_URL:", process.env.KV_REST_API_URL);
    console.log("DEBUG_KV_TOKEN_EXISTS:", !!process.env.KV_REST_API_TOKEN);
    console.log("DEBUG_RESOLVED_URL:", url);

    redisClient = new Redis({
      url,
      token,
    });
  }
  return redisClient;
}

interface BalanceStore {
  users: Record<
    string,
    {
      userId: string;
      gemBalance: number;
      tokenBalance: number;
      updatedAt: string;
    }
  >;
  orders: Record<string, unknown>;
  processedPayments: string[];
}

let memoryStore: BalanceStore = defaultStore();

function defaultStore(): BalanceStore {
  return {
    users: {},
    orders: {},
    processedPayments: [],
  };
}

function isKvConfigured(): boolean {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (FORCE_KV_URL && FORCE_KV_TOKEN),
  );
}

function normalizeStore(raw: unknown): BalanceStore {
  if (!raw || typeof raw !== "object") {
    return defaultStore();
  }

  const record = raw as Partial<BalanceStore>;
  return {
    users: record.users ?? {},
    orders: record.orders ?? {},
    processedPayments: Array.isArray(record.processedPayments) ? record.processedPayments : [],
  };
}

async function loadStore(): Promise<BalanceStore> {
  if (!isKvConfigured()) {
    console.warn("[balancesStoreEdge] No KV env vars — using in-memory store.");
    return memoryStore;
  }

  try {
    const raw = await getRedis().get<BalanceStore>(STORE_KEY);
    const store = normalizeStore(raw);
    memoryStore = store;
    return store;
  } catch (error) {
    console.warn("[balancesStoreEdge] KV read failed:", error);
    return memoryStore;
  }
}

async function saveStore(store: BalanceStore): Promise<void> {
  memoryStore = store;

  if (!isKvConfigured()) {
    return;
  }

  await getRedis().set(STORE_KEY, store);
}

function ensureUser(store: BalanceStore, userId: string) {
  if (!store.users[userId]) {
    store.users[userId] = {
      userId,
      gemBalance: DEFAULT_GEM_BALANCE,
      tokenBalance: DEFAULT_GEM_BALANCE,
      updatedAt: new Date().toISOString(),
    };
  }
  return store.users[userId]!;
}

/** Edge-safe balance lookup (used by api/account/balance.ts). */
export async function getUserBalance(userId: string) {
  const store = await loadStore();
  const user = ensureUser(store, userId);
  await saveStore(store);
  return {
    userId,
    gemBalance: user.gemBalance,
    tokenBalance: user.tokenBalance ?? user.gemBalance,
  };
}
