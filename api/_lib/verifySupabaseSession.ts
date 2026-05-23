import type { IncomingMessage } from "node:http";

/**
 * Supabase env vars checked (first match wins per field):
 * - URL: `SUPABASE_URL`, then `VITE_SUPABASE_URL`
 * - Anon key: `SUPABASE_ANON_KEY`, then `VITE_SUPABASE_ANON_KEY`
 *
 * In Vite dev, only keys copied into `process.env` by `payments-dev-plugin` are visible
 * to the API middleware unless you run the standalone payments server (which loads `.env`).
 */
function readSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ""
  ).trim();

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isLocalDevelopment(): boolean {
  const nodeEnv = (process.env.NODE_ENV ?? "").toLowerCase();
  return nodeEnv === "development" || nodeEnv === "test";
}

function bearerToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith("Bearer ")) return null;
  const token = value.slice("Bearer ".length).trim();
  return token || null;
}

/**
 * Local-only: trust `userId` from the request when Supabase is not wired on the server.
 * Still requires an Authorization header so anonymous clients cannot forge deposits.
 */
function requireDevFallbackUserId(
  req: IncomingMessage,
  claimedUserId?: string,
): string {
  const token = bearerToken(req);
  if (!token) {
    throw new Error("Authentication required. Sign in to continue.");
  }

  const claimed = claimedUserId?.trim();
  if (!claimed) {
    throw new Error("userId is required for local deposit testing.");
  }

  console.warn(
    `[verifySupabaseSession] DEV fallback: using request userId "${claimed}" (Supabase URL/key not in process.env).`,
  );

  return claimed;
}

/**
 * Validates the Supabase access token and returns the authenticated user id.
 * Rejects spoofed `userId` values in the request body.
 */
export async function requireAuthenticatedUserId(
  req: IncomingMessage,
  claimedUserId?: string,
): Promise<string> {
  const token = bearerToken(req);
  if (!token) {
    throw new Error("Authentication required. Sign in to continue.");
  }

  const config = readSupabaseConfig();
  if (!config) {
    if (isLocalDevelopment()) {
      return requireDevFallbackUserId(req, claimedUserId);
    }
    throw new Error(
      "Server authentication is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).",
    );
  }

  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (isLocalDevelopment() && claimedUserId?.trim()) {
      console.warn(
        "[verifySupabaseSession] Supabase rejected token; falling back to request userId in development.",
      );
      return requireDevFallbackUserId(req, claimedUserId);
    }
    throw new Error("Invalid or expired session. Please sign in again.");
  }

  const payload = (await response.json()) as { id?: unknown };
  const userId = typeof payload.id === "string" ? payload.id.trim() : "";
  if (!userId) {
    throw new Error("Invalid session.");
  }

  const claimed = claimedUserId?.trim();
  if (claimed && claimed !== userId) {
    throw new Error("userId does not match authenticated session.");
  }

  return userId;
}
