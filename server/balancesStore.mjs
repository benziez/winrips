import { kv } from "@vercel/kv";

const STORE_KEY = "winrips:balances";

const DEFAULT_GEM_BALANCE = 0;
const GEMS_PER_USD = 100;

/** Local dev fallback when KV env vars are not configured. */
let memoryStore = defaultStore();

function defaultStore() {
  return {
    users: {},
    orders: {},
    processedPayments: [],
  };
}

function isKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function normalizeStore(raw) {
  if (!raw || typeof raw !== "object") {
    return defaultStore();
  }

  return {
    users: raw.users ?? {},
    orders: raw.orders ?? {},
    processedPayments: Array.isArray(raw.processedPayments) ? raw.processedPayments : [],
  };
}

async function loadStore() {
  if (!isKvConfigured()) {
    console.warn(
      "[balancesStore] KV_REST_API_URL / KV_REST_API_TOKEN not set — using in-memory store for local dev.",
    );
    return memoryStore;
  }

  try {
    const raw = await kv.get(STORE_KEY);
    const store = normalizeStore(raw);
    memoryStore = store;
    return store;
  } catch (error) {
    console.warn("[balancesStore] KV read failed, using in-memory cache:", error);
    return memoryStore;
  }
}

async function saveStore(store) {
  memoryStore = store;

  if (!isKvConfigured()) {
    return;
  }

  await kv.set(STORE_KEY, store);
}

export function usdToGems(usdAmount) {
  const usd = Number(usdAmount);
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.round(usd * GEMS_PER_USD);
}

export function parseWinripsOrderId(orderId) {
  if (typeof orderId !== "string" || !orderId.startsWith("winrips-")) {
    return null;
  }
  const parts = orderId.split("-");
  if (parts.length < 3) return null;
  const timestamp = parts[parts.length - 1];
  const userId = parts.slice(1, -1).join("-");
  if (!userId || !/^\d+$/.test(timestamp)) return null;
  return { userId, timestamp };
}

function ensureUser(store, userId) {
  if (!store.users[userId]) {
    store.users[userId] = {
      userId,
      gemBalance: DEFAULT_GEM_BALANCE,
      tokenBalance: DEFAULT_GEM_BALANCE,
      updatedAt: new Date().toISOString(),
    };
  }
  return store.users[userId];
}

export async function getUserBalance(userId) {
  const store = await loadStore();
  const user = ensureUser(store, userId);
  await saveStore(store);
  return {
    userId,
    gemBalance: user.gemBalance,
    tokenBalance: user.tokenBalance ?? user.gemBalance,
  };
}

export async function registerDepositOrder({ orderId, userId, priceAmountUsd, paymentId }) {
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

export async function hasProcessedPayment(paymentId) {
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

  if (store.orders[orderId]) {
    store.orders[orderId].status = "credited";
    store.orders[orderId].creditedAt = user.updatedAt;
    store.orders[orderId].paymentStatus = paymentStatus;
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
export function __resetBalancesStoreForTests() {
  memoryStore = defaultStore();
}
