import type { IncomingMessage, ServerResponse } from "node:http";
import {
  addUserVaultItem,
  getUserVaultInventory,
  removeUserVaultItem,
  type StoredVaultCard,
} from "./vaultStore.js";
import { requireAuthenticatedUserId } from "./verifySupabaseSession.js";

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) return {};
  return JSON.parse(text) as unknown;
}

function parseStoredCard(raw: unknown): StoredVaultCard {
  if (!raw || typeof raw !== "object") {
    throw new Error("card must be an object.");
  }

  const record = raw as Record<string, unknown>;
  const vaultId = typeof record.vaultId === "string" ? record.vaultId.trim() : "";
  const id = typeof record.id === "string" ? record.id.trim() : "";
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const rarity = typeof record.rarity === "string" ? record.rarity.trim() : "Rare";
  const value = Number(record.value);
  const image = typeof record.image === "string" ? record.image.trim() : "";
  const acquiredAt =
    typeof record.acquiredAt === "string" && record.acquiredAt.trim()
      ? record.acquiredAt.trim()
      : new Date().toISOString();

  if (!vaultId || !id || !name || !image || !Number.isFinite(value) || value < 0) {
    throw new Error("Invalid vault card payload.");
  }

  return {
    vaultId,
    id,
    name,
    rarity,
    value: Math.round(value),
    image,
    acquiredAt,
  };
}

/** GET /api/vault/inventory?userId=... */
export async function handleVaultInventoryGetRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname !== "/api/vault/inventory" || req.method !== "GET") {
    return false;
  }

  const userId = url.searchParams.get("userId")?.trim() ?? "";
  if (!userId) {
    sendJson(res, 400, { error: "userId query parameter is required." });
    return true;
  }

  try {
    const items = await getUserVaultInventory(userId);
    sendJson(res, 200, { userId, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vault lookup failed.";
    sendJson(res, 500, { error: message });
  }

  return true;
}

/** POST /api/vault/inventory — add or remove items for the authenticated user. */
export async function handleVaultInventoryMutateRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname !== "/api/vault/inventory" || req.method !== "POST") {
    return false;
  }

  try {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const claimedUserId = typeof body.userId === "string" ? body.userId.trim() : "";
    const userId = await requireAuthenticatedUserId(req, claimedUserId);

    if (action === "add") {
      const card = parseStoredCard(body.card);
      const items = await addUserVaultItem(userId, card);
      sendJson(res, 200, { userId, items });
      return true;
    }

    if (action === "remove") {
      const vaultId = typeof body.vaultId === "string" ? body.vaultId.trim() : "";
      if (!vaultId) {
        sendJson(res, 400, { error: "vaultId is required for remove." });
        return true;
      }
      const items = await removeUserVaultItem(userId, vaultId);
      sendJson(res, 200, { userId, items });
      return true;
    }

    sendJson(res, 400, { error: "action must be add or remove." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vault update failed.";
    const status =
      message.includes("Authentication") ||
      message.includes("session") ||
      message.includes("Sign in")
        ? 401
        : 400;
    sendJson(res, status, { error: message });
  }

  return true;
}
