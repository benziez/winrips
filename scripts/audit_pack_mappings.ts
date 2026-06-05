/**
 * Dry-run audit: compare public.pack_card_weights to the client roll pool
 * (getPackRollPool — same source as RNG + What's Inside).
 *
 * No DB writes or deletes.
 *
 *   npx vite-node scripts/audit_pack_mappings.ts
 *   npx vite-node scripts/audit_pack_mappings.ts --pack=god-pack-1999
 *
 * Env (.env): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (optional — engine-only without creds)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ACTIVE_POKEMON_PACK_IDS, LIMITED_DROP_PACK_IDS } from "../src/constants/packs";
import { getPackRollPool } from "../src/data/boxCatalog";
import { gemsToUsd } from "../src/constants/retail";
import { findPackForCatalogItemId } from "../src/data/boxCatalog";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface DbWeightRow {
  pack_id: string;
  catalog_item_id: string;
  item_name: string;
  value_gems: number;
  store_rarity: string;
}

interface PackAudit {
  packId: string;
  expectedCount: number;
  dbCount: number;
  missingFromDb: { id: string; name: string }[];
  extraInDb: DbWeightRow[];
  suspectValues: { id: string; name: string; valueGems: number; usd: string; note: string }[];
  homePackMismatch: { id: string; name: string; dbPack: string; likelyPack: string }[];
}

function loadEnvFromFile(): void {
  try {
    const text = readFileSync(join(__dirname, "../.env"), "utf8");
    for (const line of text.split("\n")) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const key = match[1]!;
      let value = match[2]!.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* no .env */
  }
}

function parsePackFilter(): string | null {
  const arg = process.argv.find((a) => a.startsWith("--pack="));
  return arg?.split("=")[1]?.trim() || null;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function auditPack(packId: string, dbRows: DbWeightRow[]): PackAudit {
  const expected = getPackRollPool(packId);
  const expectedById = new Map(expected.map((item) => [item.id, item]));
  const expectedIds = new Set(expectedById.keys());
  const dbById = new Map(dbRows.map((row) => [row.catalog_item_id, row]));

  const missingFromDb = [...expectedIds]
    .filter((id) => !dbById.has(id))
    .map((id) => ({ id, name: expectedById.get(id)!.name }));

  const extraInDb = dbRows.filter((row) => !expectedIds.has(row.catalog_item_id));

  const suspectValues: PackAudit["suspectValues"] = [];
  for (const row of dbRows) {
    const engine = expectedById.get(row.catalog_item_id);
    if (!engine) continue;
    const dbGems = Number(row.value_gems);
    const engineGems = engine.value;
    if (dbGems !== engineGems) {
      suspectValues.push({
        id: row.catalog_item_id,
        name: row.item_name,
        valueGems: dbGems,
        usd: formatUsd(gemsToUsd(dbGems)),
        note: `DB ${dbGems} gems vs engine ${engineGems} gems (${formatUsd(gemsToUsd(engineGems))})`,
      });
    } else if (dbGems >= 10_000 && engine.rarity === "Common") {
      suspectValues.push({
        id: row.catalog_item_id,
        name: row.item_name,
        valueGems: dbGems,
        usd: formatUsd(gemsToUsd(dbGems)),
        note: "Common tier with grail-scale gem value",
      });
    }
  }

  const homePackMismatch: PackAudit["homePackMismatch"] = [];
  for (const row of extraInDb) {
    const likely = findPackForCatalogItemId(row.catalog_item_id, row.value_gems);
    homePackMismatch.push({
      id: row.catalog_item_id,
      name: row.item_name,
      dbPack: packId,
      likelyPack: likely?.id ?? "(not in any engine pool)",
    });
  }

  return {
    packId,
    expectedCount: expected.length,
    dbCount: dbRows.length,
    missingFromDb,
    extraInDb,
    suspectValues,
    homePackMismatch,
  };
}

function printAudit(result: PackAudit): void {
  const hasIssues =
    result.missingFromDb.length > 0 ||
    result.extraInDb.length > 0 ||
    result.suspectValues.length > 0;

  console.log(
    `\n${result.packId}  engine=${result.expectedCount}  db=${result.dbCount}  ${
      hasIssues ? "*** ISSUES ***" : "OK"
    }`,
  );

  if (result.missingFromDb.length > 0) {
    console.log(`  Missing from DB (${result.missingFromDb.length}):`);
    for (const row of result.missingFromDb.slice(0, 12)) {
      console.log(`    - ${row.id}  ${row.name}`);
    }
    if (result.missingFromDb.length > 12) {
      console.log(`    … +${result.missingFromDb.length - 12} more`);
    }
  }

  if (result.extraInDb.length > 0) {
    console.log(`  Extra / wrong-pack rows in DB (${result.extraInDb.length}):`);
    for (const row of result.extraInDb.slice(0, 12)) {
      const home = result.homePackMismatch.find((h) => h.id === row.catalog_item_id);
      const hint = home ? ` → likely belongs in ${home.likelyPack}` : "";
      console.log(
        `    - ${row.catalog_item_id}  ${row.item_name}  (${row.value_gems} gems)${hint}`,
      );
    }
    if (result.extraInDb.length > 12) {
      console.log(`    … +${result.extraInDb.length - 12} more`);
    }
  }

  if (result.suspectValues.length > 0) {
    console.log(`  Value drift (${result.suspectValues.length}):`);
    for (const row of result.suspectValues.slice(0, 8)) {
      console.log(`    - ${row.id}  ${row.name}  ${row.usd}  — ${row.note}`);
    }
    if (result.suspectValues.length > 8) {
      console.log(`    … +${result.suspectValues.length - 8} more`);
    }
  }
}

async function main(): Promise<void> {
  loadEnvFromFile();

  const packFilter = parsePackFilter();
  const packIds = [...ACTIVE_POKEMON_PACK_IDS, ...LIMITED_DROP_PACK_IDS].filter(
    (id) => !packFilter || id === packFilter,
  );

  if (packFilter && packIds.length === 0) {
    throw new Error(`Unknown pack id: ${packFilter}`);
  }

  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  let dbByPack = new Map<string, DbWeightRow[]>();

  if (url && serviceKey) {
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("pack_card_weights")
      .select("pack_id, catalog_item_id, item_name, value_gems, store_rarity")
      .in("pack_id", packIds);

    if (error) {
      throw new Error(`pack_card_weights read failed: ${error.message}`);
    }

    dbByPack = new Map();
    for (const raw of data ?? []) {
      const row = raw as DbWeightRow;
      const list = dbByPack.get(row.pack_id) ?? [];
      list.push(row);
      dbByPack.set(row.pack_id, list);
    }
    console.log(`Loaded ${data?.length ?? 0} DB rows across ${packIds.length} packs.`);
  } else {
    console.warn(
      "[audit] No Supabase creds — engine-only mode (extras/missing vs DB will be empty).",
    );
  }

  const results = packIds.map((packId) =>
    auditPack(packId, dbByPack.get(packId) ?? []),
  );

  let totalExtras = 0;
  let totalMissing = 0;
  let totalValueDrift = 0;

  for (const result of results) {
    printAudit(result);
    totalExtras += result.extraInDb.length;
    totalMissing += result.missingFromDb.length;
    totalValueDrift += result.suspectValues.length;
  }

  const failedPacks = results.filter(
    (r) => r.extraInDb.length > 0 || r.missingFromDb.length > 0,
  ).length;

  console.log(
    `\n================ SUMMARY ================\n` +
      `  Packs audited:     ${results.length}\n` +
      `  Packs with issues: ${failedPacks}\n` +
      `  Extra DB rows:     ${totalExtras}\n` +
      `  Missing from DB:   ${totalMissing}\n` +
      `  Value drift rows:  ${totalValueDrift}\n` +
      `  Mode:              dry-run (no writes)\n` +
      `=========================================\n`,
  );

  if (failedPacks > 0 || totalValueDrift > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
