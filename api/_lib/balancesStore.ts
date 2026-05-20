import { Redis } from "@upstash/redis";

const STORE_KEY = "winrips:balances";

let redisClient: Redis | null = null;

function resolveKvCredentials(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? undefined;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? undefined;

  if (!url || !token) return null;
  return { url, token };
}

function getRedis(): Redis {
  if (!redisClient) {
    const creds = resolveKvCredentials();
    if (!creds) {
      throw new Error(
        "Missing KV credentials: set KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*) in Vercel env.",
      );
    }
    redisClient = new Redis(creds);
  }
  return redisClient;
}

const DEFAULT_GEM_BALANCE = 0;
const GEMS_PER_USD = 100;

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

/** Local dev fallback when KV env vars are not configured. */
let memoryStore = defaultStore();

function defaultStore(): BalanceStore {
  return {
    users: {},
    orders: {},
    processedPayments: [],
  };
}

function isKvConfigured(): boolean {
  return resolveKvCredentials() !== null;
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
    console.warn(
      "[balancesStore] KV_REST_API_URL / KV_REST_API_TOKEN not set — using in-memory store for local dev.",
    );
    return memoryStore;
  }

  try {
    const raw = await getRedis().get<BalanceStore>(STORE_KEY);
    const store = normalizeStore(raw);
    memoryStore = store;
    return store;
  } catch (error) {
    console.warn("[balancesStore] KV read failed, using in-memory cache:", error);
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

export function usdToGems(usdAmount: number | string): number {
  const usd = Number(usdAmount);
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.round(usd * GEMS_PER_USD);
}

export function parseWinripsOrderId(orderId: string): { userId: string; timestamp: string } | null {
  if (!orderId.startsWith("winrips-")) {
    return null;
  }
  const parts = orderId.split("-");
  if (parts.length < 3) return null;
  const timestamp = parts[parts.length - 1]!;
  const userId = parts.slice(1, -1).join("-");
  if (!userId || !/^\d+$/.test(timestamp)) return null;
  return { userId, timestamp };
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

export async function registerDepositOrder({
  orderId,
  userId,
  priceAmountUsd,
  paymentId,
}: {
  orderId: string;
  userId: string;
  priceAmountUsd: number;
  paymentId: string;
}) {
  const store = await loadStore();
  ensureUser(store, userId);
  const gems = usdToGems(priceAmountUsd);
  store.orders[orderId] = {
    orderId,
    userId,
    paymentId: paymentId ? String(paymentId) : null,
    priceAmountUsd: Number(priceAmountUsd),
    gemsExpected: gems,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await saveStore(store);
  return store.orders[orderId];
}

export async function hasProcessedPayment(paymentId: string): Promise<boolean> {
  if (!paymentId) return false;
  const store = await loadStore();
  return store.processedPayments.includes(String(paymentId));
}

export async function creditGemsFromDeposit({
  userId,
  gems,
  paymentId,
  orderId,
  paymentStatus,
}: {
  userId: string;
  gems: number;
  paymentId: string | null;
  orderId: string;
  paymentStatus: string;
}) {
  const store = await loadStore();
  const id = paymentId ? String(paymentId) : null;

  if (id && store.processedPayments.includes(id)) {
    const user = ensureUser(store, userId);
    return {
      credited: false,
      duplicate: true,
      gemBalance: user.gemBalance,
      gems: 0,
    };
  }

  const user = ensureUser(store, userId);
  const creditAmount = Math.max(0, Math.round(Number(gems)));
  user.gemBalance += creditAmount;
  user.tokenBalance = user.gemBalance;
  user.updatedAt = new Date().toISOString();

  const order = store.orders[orderId] as Record<string, unknown> | undefined;
  if (order) {
    order.status = "credited";
    order.creditedAt = user.updatedAt;
    order.paymentStatus = paymentStatus;
  }

  if (id) {
    store.processedPayments.push(id);
  }

  await saveStore(store);

  return {
    credited: true,
    duplicate: false,
    gemBalance: user.gemBalance,
    gems: creditAmount,
  };
}

/** @internal Resets in-memory cache (tests / local dev). Does not clear KV. */
export function __resetBalancesStoreForTests(): void {
  memoryStore = defaultStore();
}
