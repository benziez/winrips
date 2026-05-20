#!/usr/bin/env node
/**
 * Set a user's gem balance via the dev-only API.
 *
 * Usage:
 *   node scripts/setGemBalance.mjs [userId] [gemBalance]
 *   npm run dev:set-balance -- u_abc123 5000
 *
 * Env (from .env in project root):
 *   DEV_BALANCE_SECRET — must match server
 * Optional:
 *   WINRIPS_API_BASE — default http://localhost:4444
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv() {
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadDotEnv();

const userId = process.argv[2] ?? process.env.WINRIPS_USER_ID;
const gemBalance = Number(process.argv[3] ?? process.env.WINRIPS_GEM_BALANCE ?? 5000);
const secret = process.env.DEV_BALANCE_SECRET?.trim();
const baseUrl = (process.env.WINRIPS_API_BASE ?? "http://localhost:4444").replace(/\/$/, "");

if (!userId) {
  console.error("Usage: node scripts/setGemBalance.mjs <userId> [gemBalance]");
  console.error("Or set WINRIPS_USER_ID in the environment.");
  process.exit(1);
}

if (!secret) {
  console.error("Missing DEV_BALANCE_SECRET in .env");
  process.exit(1);
}

if (!Number.isFinite(gemBalance) || gemBalance < 0) {
  console.error("gemBalance must be a non-negative number.");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/account/balance/dev-set`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-dev-balance-secret": secret,
  },
  body: JSON.stringify({ userId, gemBalance }),
});

const text = await response.text();
let data;
try {
  data = text ? JSON.parse(text) : {};
} catch {
  data = { raw: text };
}

if (!response.ok) {
  console.error(`Failed (${response.status}):`, data);
  process.exit(1);
}

console.log("Balance updated:", data);
console.log(`GET ${baseUrl}/api/account/balance?userId=${encodeURIComponent(userId)}`);
