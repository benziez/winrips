export const runtime = "edge";

import { getUserBalance } from "../_lib/balancesStoreEdge.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** GET /api/account/balance?userId=... — Edge runtime balance sync. */
export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId")?.trim() ?? "";

    if (!userId) {
      return jsonResponse({ error: "userId query parameter is required." }, 400);
    }

    const balance = await getUserBalance(userId);
    return jsonResponse(balance, 200);
  } catch (e: unknown) {
    const err = e as { message?: string; stack?: string };
    return new Response(
      JSON.stringify({
        error: err.message ?? String(e),
        stack: err.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
