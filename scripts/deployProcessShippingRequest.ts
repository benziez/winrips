/**
 * Deploy supabase/process_shipping_request.sql to the linked Supabase project.
 * Requires SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env (Dashboard → Database → URI).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFromFile(): void {
  try {
    const text = readFileSync(join(__dirname, "../.env"), "utf8");
    for (const line of text.split("\n")) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      let value = match[2]!.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(match[1]! in process.env)) process.env[match[1]!] = value;
    }
  } catch {
    /* optional */
  }
}

function resolveDbUrl(): string {
  const direct = process.env.SUPABASE_DB_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const ref = process.env.SUPABASE_PROJECT_REF?.trim() || "zyqcvmjziyebiuazkggo";
  if (!password) {
    throw new Error(
      "Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env (Supabase Dashboard → Project Settings → Database).",
    );
  }

  const encoded = encodeURIComponent(password);
  return `postgresql://postgres.${ref}:${encoded}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
}

/** Production-safe constraint — includes statuses used by exchange / upgrade flows. */
const DEPLOY_SQL = readFileSync(join(__dirname, "../supabase/process_shipping_request.sql"), "utf8")
  .replace(
    /check \(\s*status in \(\s*'vaulted',\s*'pending_shipment',\s*'shipped',\s*'delivered'\s*\)\s*\);/s,
    `check (
    status in (
      'vaulted',
      'pending_shipment',
      'shipped',
      'delivered',
      'exchanged',
      'upgraded_lost'
    )
  );`,
  );

async function main(): Promise<void> {
  loadEnvFromFile();
  const dbUrl = resolveDbUrl();
  const sql = postgres(dbUrl, { max: 1, ssl: "require", connect_timeout: 30 });

  try {
    console.log("Deploying process_shipping_request…");
    await sql.unsafe(DEPLOY_SQL);

    const [{ proname }] = await sql<{ proname: string }[]>`
      select proname from pg_proc
      where proname = 'process_shipping_request'
      limit 1
    `;
    if (!proname) {
      throw new Error("Function process_shipping_request not found after deploy.");
    }

    console.log("OK — function redeployed (uses pending_shipment).");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
