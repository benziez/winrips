import type { IncomingMessage, ServerResponse } from "node:http";

async function loadBalancesStore() {
  return import("../../server/balancesStore.mjs");
}

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
    const store = await loadBalancesStore();
    const balance = await store.getUserBalance(userId);
    sendJson(res, 200, balance);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Balance lookup failed.";
    sendJson(res, 500, { error: message });
  }

  return true;
}
