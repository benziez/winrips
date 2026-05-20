import type { IncomingMessage, ServerResponse } from "node:http";
import { getUserBalance, setUserGemBalance } from "./balancesStore.js";

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

/** GET /api/account/balance?userId=... — sync server-side gem balance to client. */
export async function handleAccountBalanceRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname !== "/api/account/balance" || req.method !== "GET") {
    return false;
  }

  const userId = url.searchParams.get("userId")?.trim() ?? "";
  if (!userId) {
    sendJson(res, 400, { error: "userId query parameter is required." });
    return true;
  }

  try {
    const balance = await getUserBalance(userId);
    sendJson(res, 200, balance);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Balance lookup failed.";
    sendJson(res, 500, { error: message });
  }

  return true;
}

function readDevBalanceSecret(req: IncomingMessage): string {
  const header = req.headers["x-dev-balance-secret"];
  if (typeof header === "string") return header.trim();
  if (Array.isArray(header)) return header[0]?.trim() ?? "";
  return "";
}

function isDevBalanceRouteEnabled(): boolean {
  return Boolean(process.env.DEV_BALANCE_SECRET?.trim());
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

/**
 * POST /api/account/balance/dev-set — dev-only absolute balance setter.
 * Requires header x-dev-balance-secret matching DEV_BALANCE_SECRET.
 */
export async function handleDevSetBalanceRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname !== "/api/account/balance/dev-set" || req.method !== "POST") {
    return false;
  }

  if (!isDevBalanceRouteEnabled()) {
    sendJson(res, 404, { error: "Dev balance route is disabled." });
    return true;
  }

  const expectedSecret = process.env.DEV_BALANCE_SECRET!.trim();
  if (readDevBalanceSecret(req) !== expectedSecret) {
    sendJson(res, 401, { error: "Invalid dev balance secret." });
    return true;
  }

  try {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const gemBalance = Number(body.gemBalance ?? 5000);

    if (!userId) {
      sendJson(res, 400, { error: "userId is required." });
      return true;
    }

    if (!Number.isFinite(gemBalance) || gemBalance < 0) {
      sendJson(res, 400, { error: "gemBalance must be a non-negative number." });
      return true;
    }

    const balance = await setUserGemBalance(userId, gemBalance);
    sendJson(res, 200, { ok: true, ...balance });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dev balance update failed.";
    sendJson(res, 500, { error: message });
  }

  return true;
}
