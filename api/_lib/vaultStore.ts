import { Redis } from "@upstash/redis";

const STORE_KEY = "winrips:vault";

export interface StoredVaultCard {
  vaultId: string;
  id: string;
  name: string;
  rarity: string;
  value: number;
  image: string;
  acquiredAt: string;
}

interface VaultStore {
  users: Record<string, StoredVaultCard[]>;
}

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

let memoryStore: VaultStore = defaultStore();

function defaultStore(): VaultStore {
  return { users: {} };
}

function isKvConfigured(): boolean {
  return resolveKvCredentials() !== null;
}

function normalizeStore(raw: unknown): VaultStore {
  if (!raw || typeof raw !== "object") {
    return defaultStore();
  }

  const record = raw as Partial<VaultStore>;
  const users: Record<string, StoredVaultCard[]> = {};

  if (record.users && typeof record.users === "object") {
    for (const [userId, items] of Object.entries(record.users)) {
      if (!Array.isArray(items)) continue;
      users[userId] = items.filter(isStoredVaultCard);
    }
  }

  return { users };
}

function isStoredVaultCard(value: unknown): value is StoredVaultCard {
  if (!value || typeof value !== "object") return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.vaultId === "string" &&
    typeof card.id === "string" &&
    typeof card.name === "string" &&
    typeof card.rarity === "string" &&
    typeof card.value === "number" &&
    Number.isFinite(card.value) &&
    typeof card.image === "string" &&
    typeof card.acquiredAt === "string"
  );
}

async function loadStore(): Promise<VaultStore> {
  if (!isKvConfigured()) {
    console.warn(
      "[vaultStore] KV_REST_API_URL / KV_REST_API_TOKEN not set — using in-memory store for local dev.",
    );
    return memoryStore;
  }

  try {
    const raw = await getRedis().get<VaultStore>(STORE_KEY);
    const store = normalizeStore(raw);
    memoryStore = store;
    return store;
  } catch (error) {
    console.warn("[vaultStore] KV read failed, using in-memory cache:", error);
    return memoryStore;
  }
}

async function saveStore(store: VaultStore): Promise<void> {
  memoryStore = store;

  if (!isKvConfigured()) {
    return;
  }

  await getRedis().set(STORE_KEY, store);
}

function ensureUserInventory(store: VaultStore, userId: string): StoredVaultCard[] {
  if (!store.users[userId]) {
    store.users[userId] = [];
  }
  return store.users[userId]!;
}

export async function getUserVaultInventory(userId: string): Promise<StoredVaultCard[]> {
  const store = await loadStore();
  return [...(store.users[userId] ?? [])];
}

export async function addUserVaultItem(
  userId: string,
  card: StoredVaultCard,
): Promise<StoredVaultCard[]> {
  const store = await loadStore();
  const inventory = ensureUserInventory(store, userId);
  const withoutDuplicate = inventory.filter((item) => item.vaultId !== card.vaultId);
  store.users[userId] = [card, ...withoutDuplicate];
  await saveStore(store);
  return store.users[userId]!;
}

export async function removeUserVaultItem(
  userId: string,
  vaultId: string,
): Promise<StoredVaultCard[]> {
  const store = await loadStore();
  const inventory = ensureUserInventory(store, userId);
  store.users[userId] = inventory.filter((item) => item.vaultId !== vaultId);
  await saveStore(store);
  return store.users[userId]!;
}
