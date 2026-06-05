import type { IncomingMessage } from "node:http";
import type { VercelRequest } from "@vercel/node";

const STRIPE_API_PREFIX = "/api/stripe";

/**
 * Normalizes Stripe API paths for Vercel catch-all `api/stripe/[...path].ts`.
 * Handlers expect `/api/stripe/create-payment-intent` but the catch-all may pass
 * `/create-payment-intent`, query segments, or URLs with query strings attached.
 */
export function normalizeStripeApiPath(rawUrl: string | undefined): string {
  const withoutQuery = (rawUrl ?? "").split("?")[0].replace(/\/+$/, "") || "/";

  if (withoutQuery.startsWith(`${STRIPE_API_PREFIX}/`)) {
    return withoutQuery;
  }

  const segment = withoutQuery.replace(/^\/+/, "");
  if (segment && segment !== "api" && segment !== "stripe") {
    return `${STRIPE_API_PREFIX}/${segment}`;
  }

  return withoutQuery;
}

/** Resolve path from Vercel catch-all query + url. */
export function stripePathFromVercelRequest(req: VercelRequest): string {
  const pathQuery = req.query.path;

  if (typeof pathQuery === "string" && pathQuery.trim()) {
    const segments = pathQuery
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    if (segments.length > 0) {
      return `${STRIPE_API_PREFIX}/${segments.join("/")}`;
    }
  }

  if (Array.isArray(pathQuery) && pathQuery.length > 0) {
    const segments = pathQuery.map(String).filter(Boolean);
    if (segments.length > 0) {
      return `${STRIPE_API_PREFIX}/${segments.join("/")}`;
    }
  }

  return normalizeStripeApiPath(req.url);
}

export function getStripeRequestPath(req: IncomingMessage): string {
  return normalizeStripeApiPath(req.url);
}

export function isStripeRoute(
  req: IncomingMessage,
  method: string,
  routeSuffix: string,
): boolean {
  const normalizedRoute = routeSuffix.replace(/^\/+/, "");
  return (
    req.method === method &&
    getStripeRequestPath(req) === `${STRIPE_API_PREFIX}/${normalizedRoute}`
  );
}
