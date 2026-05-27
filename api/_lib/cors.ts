import type { IncomingMessage, ServerResponse } from "node:http";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = new Set([
  "https://www.winrips.com",
  "https://winrips.com",
  "capacitor://localhost",
  "http://localhost:4444",
]);

/** Must include every non-simple header sent by native/web API clients. */
export const CORS_ALLOW_HEADERS = "Authorization, Content-Type, x-dev-balance-secret";

const CORS_ALLOW_METHODS = "GET, POST, OPTIONS";

function readOrigin(req: IncomingMessage | VercelRequest): string | undefined {
  const raw = req.headers.origin;
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

function readMethod(req: IncomingMessage | VercelRequest): string {
  return (req.method ?? "GET").toUpperCase();
}

export function applyCorsHeaders(
  req: IncomingMessage | VercelRequest,
  res: ServerResponse | VercelResponse,
): void {
  const origin = readOrigin(req);
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
  res.setHeader("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  res.setHeader("Access-Control-Max-Age", "86400");
}

/** Returns true when an OPTIONS preflight was fully handled. */
export function handleCorsPreflight(
  req: IncomingMessage | VercelRequest,
  res: ServerResponse | VercelResponse,
): boolean {
  if (readMethod(req) !== "OPTIONS") return false;

  applyCorsHeaders(req, res);

  if ("status" in res && typeof res.status === "function") {
    res.status(204).end();
    return true;
  }

  const nodeRes = res as ServerResponse;
  nodeRes.statusCode = 204;
  nodeRes.end();
  return true;
}

/** Apply CORS headers and short-circuit OPTIONS. Call at the top of Vercel handlers. */
export function handleApiCors(req: VercelRequest, res: VercelResponse): boolean {
  applyCorsHeaders(req, res);
  return handleCorsPreflight(req, res);
}
