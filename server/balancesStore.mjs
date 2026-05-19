import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(root, "data");
const STORE_PATH = path.join(DATA_DIR, "balances.json");

const DEFAULT_GEM_BALANCE = 25_000;
const GEMS_PER_USD = 100;

function defaultStore() {
  return {
    users: {},
    orders: {},
    processedPayments: [],
  };
}

function loadStore() {
  if (!existsSync(STORE_PATH)) {
    return defaultStore();
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users ?? {},
      orders: parsed.orders ?? {},
      processedPayments: Array.isArray(parsed.processedPayments)
        ? parsed.processedPayments
        : [],
    };
  } catch {
    return defaultStore();
  }
}

function saveStore(store) {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
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

export function ensureUser(store, userId) {
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

export function getUserBalance(userId) {
  const store = loadStore();
  const user = ensureUser(store, userId);
  saveStore(store);
  return {
    userId,
    gemBalance: user.gemBalance,
    tokenBalance: user.tokenBalance ?? user.gemBalance,
  };
}

export function registerDepositOrder({ orderId, userId, priceAmountUsd, paymentId }) {
  const store = loadStore();
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
  saveStore(store);
  return store.orders[orderId];
}

export function hasProcessedPayment(paymentId) {
  if (!paymentId) return false;
  const store = loadStore();
  return store.processedPayments.includes(String(paymentId));
}

export function creditGemsFromDeposit({
  userId,
  gems,
  paymentId,
  orderId,
  paymentStatus,
}) {
  const store = loadStore();
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

  saveStore(store);

  return {
    credited: true,
    duplicate: false,
    gemBalance: user.gemBalance,
    gems: creditAmount,
  };
}
