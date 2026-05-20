import { Redis } from "@upstash/redis/cloudflare";

const STORE_KEY = "winrips:balances";
const DEFAULT_GEM_BALANCE = 0;

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
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
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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
    return memoryStore;
  }

  try {
    const raw = await getRedis().get<BalanceStore>(STORE_KEY);
    const store = normalizeStore(raw);
    memoryStore = store;
    return store;
  } catch {
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
