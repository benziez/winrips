import crypto from "node:crypto";
import type { IncomingMessage } from "node:http";

/** Reads `x-nowpayments-sig` from an incoming Node HTTP request. */
export function getNowPaymentsSignatureHeader(req: IncomingMessage): string {
  const raw = req.headers["x-nowpayments-sig"];
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0] ?? "";
  return "";
}

/**
 * Verifies a NOWPayments IPN HMAC-SHA512 signature.
 * Body keys are sorted alphabetically (top level) before hashing, per NOWPayments docs.
 */
export function verifyNowPaymentsIpnSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const sig = typeof signatureHeader === "string" ? signatureHeader.trim() : "";
  const key = typeof secret === "string" ? secret.trim() : "";
  if (!key || !sig || !rawBody?.trim()) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return false;
  }

  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(parsed as Record<string, unknown>).sort()) {
    sorted[k] = (parsed as Record<string, unknown>)[k];
  }

  const payload = JSON.stringify(sorted);
  const expected = crypto.createHmac("sha512", key).update(payload).digest("hex");
  const expectedLower = expected.toLowerCase();
  const receivedLower = sig.toLowerCase();

  if (expectedLower.length !== receivedLower.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expectedLower, "utf8"),
    Buffer.from(receivedLower, "utf8"),
  );
}
