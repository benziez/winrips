/**
 * PART 1 — Precompute/sync per-pack per-card roll weights into the DB.
 *
 * Single source of truth: whatever getPackRollPool(packId) returns (the EXACT same
 * path the RNG + odds sheet use, including PACK_FLOOR_OVERRIDES + floor fillers) is
 * what gets written to public.pack_card_weights. No calibration math is re-implemented.
 *
 * Modes:
 *   (default)        upsert weights to the DB (idempotent), then verify parity DB<->engine.
 *   --check / --dry  compute + print the parity table only; no DB writes, no creds needed.
 *
 * Run with vite-node (the engine pulls Vite-only asset imports):
 *   npx vite-node scripts/syncPackWeights.ts            # write + verify
 *   npx vite-node scripts/syncPackWeights.ts --check    # parity only, no DB
 *
 * Re-run after any change to pools / card values / PACK_FLOOR_OVERRIDES.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ACTIVE_POKEMON_PACK_IDS, LIMITED_DROP_PACK_IDS } from "../src/constants/packs";
import { getPackRollPool } from "../src/data/boxCatalog";
import { getPackDropTable } from "../src/data/packDropTables";
import { getPackTierOdds, PACK_TIER_ORDER } from "../src/utils/packTierOdds";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHECK_ONLY = process.argv.slice(2).some((a) => a === "--check" || a === "--dry" || a === "--dry-run");
const PARITY_TOLERANCE_PP = 0.05;

interface WeightRow {
  pack_id: string;
  catalog_item_id: string;
  item_name: string;
  store_rarity: string;
  roll_weight: number;
  value_gems: number;
  image_url: string;
}

/** Columns refreshed from packPokemonPools on every sync (display + roll metadata). */
const UPSERT_CONFLICT = "pack_id,catalog_item_id";

function toUpsertPayload(rows: WeightRow[]) {
  const updated_at = new Date().toISOString();
  return rows.map((row) => ({
    pack_id: row.pack_id,
    catalog_item_id: row.catalog_item_id,
    // Display fields — must overwrite stale DB values on conflict (name / rarity / price / image).
    item_name: row.item_name,
    store_rarity: row.store_rarity,
    value_gems: row.value_gems,
    image_url: row.image_url,
    // Roll weight — same source of truth, always merged on conflict.
    roll_weight: row.roll_weight,
    updated_at,
  }));
}

/** Robust .env loader — the repo .env has a few non KEY=VALUE lines we must skip. */
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
    /* no .env — rely on ambient process.env */
  }
}

/** Build the rows exactly from the engine's roll pool (the source of truth). */
function buildRowsForPack(packId: string): WeightRow[] {
  const pool = getPackRollPool(packId);
  return pool.map((item) => ({
    pack_id: packId,
    catalog_item_id: item.id,
    item_name: item.name,
    store_rarity: item.rarity,
    roll_weight: item.probability,
    value_gems: Math.max(0, Math.round(item.value)),
    image_url: item.image ?? "",
  }));
}

/** Tier % from a set of rows = sum of roll_weight per rarity, normalized to 100. */
function tierPercentsFromRows(rows: WeightRow[]): Map<string, number> {
  const total = rows.reduce((sum, r) => sum + r.roll_weight, 0);
  const byTier = new Map<string, number>();
  for (const tier of PACK_TIER_ORDER) byTier.set(tier, 0);
  for (const r of rows) {
    if (total <= 0) continue;
    byTier.set(r.store_rarity, (byTier.get(r.store_rarity) ?? 0) + (r.roll_weight / total) * 100);
  }
  return byTier;
}

interface PackParity {
  packId: string;
  rowCount: number;
  tierRows: { tier: string; clientPct: number; storedPct: number; match: boolean }[];
  maxPerCardDiff: number;
  ok: boolean;
}

/** Verify stored-representation rows reproduce client tier % + per-card probabilities. */
function verifyParity(packId: string, rows: WeightRow[]): PackParity {
  const clientTiers = getPackTierOdds(packId);
  const storedTiers = tierPercentsFromRows(rows);

  const tierRows = PACK_TIER_ORDER.map((tier) => {
    const clientPct = clientTiers.find((t) => t.tier === tier)?.probability ?? 0;
    const storedPct = storedTiers.get(tier) ?? 0;
    return { tier, clientPct, storedPct, match: Math.abs(clientPct - storedPct) < PARITY_TOLERANCE_PP };
  });

  // Per-card: stored roll_weight (re-normalized) vs the drop-table probability.
  const total = rows.reduce((sum, r) => sum + r.roll_weight, 0);
  const storedById = new Map(rows.map((r) => [r.catalog_item_id, total > 0 ? (r.roll_weight / total) * 100 : 0]));
  let maxPerCardDiff = 0;
  for (const entry of getPackDropTable(packId)) {
    const stored = storedById.get(entry.card.id) ?? 0;
    maxPerCardDiff = Math.max(maxPerCardDiff, Math.abs(stored - entry.probability));
  }

  const ok = tierRows.every((t) => t.match) && maxPerCardDiff < PARITY_TOLERANCE_PP;
  return { packId, rowCount: rows.length, tierRows, maxPerCardDiff, ok };
}

function printParityTable(results: PackParity[]): void {
  console.log("\n================ PART 1 PARITY: stored weights vs client engine ================");
  for (const r of results) {
    console.log(`\n${r.packId}  (${r.rowCount} cards)  ${r.ok ? "PARITY OK" : "*** DIVERGES ***"}`);
    console.log(`  tier        client %    stored %    match`);
    for (const t of r.tierRows) {
      console.log(
        `  ${t.tier.padEnd(10)}  ${t.clientPct.toFixed(3).padStart(8)}    ${t.storedPct
          .toFixed(3)
          .padStart(8)}    ${t.match ? "y" : "n"}`,
      );
    }
    console.log(`  max per-card diff: ${r.maxPerCardDiff.toFixed(4)}pp (tol ${PARITY_TOLERANCE_PP}pp)`);
  }
  const allOk = results.every((r) => r.ok);
  console.log(
    `\n================ ${allOk ? "ALL PACKS PARITY OK" : "PARITY FAILED — DO NOT PROCEED"} (${results.filter((r) => r.ok).length}/${results.length}) ================\n`,
  );
}

async function main(): Promise<void> {
  loadEnvFromFile();

  const packIds = [...ACTIVE_POKEMON_PACK_IDS, ...LIMITED_DROP_PACK_IDS];
  const rowsByPack = new Map<string, WeightRow[]>();
  for (const packId of packIds) rowsByPack.set(packId, buildRowsForPack(packId));

  if (CHECK_ONLY) {
    const results = packIds.map((id) => verifyParity(id, rowsByPack.get(id)!));
    printParityTable(results);
    if (!results.every((r) => r.ok)) process.exit(1);
    console.log("[--check] No DB writes performed.");
    return;
  }

  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (set in .env). Use --check to verify parity without DB.");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let written = 0;
  for (const packId of packIds) {
    const rows = toUpsertPayload(rowsByPack.get(packId)!);

    // merge-duplicates = ON CONFLICT DO UPDATE SET … for every column in the payload
    // (item_name, store_rarity, value_gems, image_url, roll_weight, updated_at).
    const { error } = await supabase.from("pack_card_weights").upsert(rows, {
      onConflict: UPSERT_CONFLICT,
      ignoreDuplicates: false,
      defaultToNull: false,
    });
    if (error) {
      throw new Error(`Upsert failed for ${packId}: ${error.message}`);
    }

    const currentIds = rows.map((row) => row.catalog_item_id);
    const { error: pruneError } = await supabase
      .from("pack_card_weights")
      .delete()
      .eq("pack_id", packId)
      .not(
        "catalog_item_id",
        "in",
        `(${currentIds.map((id) => `"${id.replace(/"/g, '""')}"`).join(",")})`,
      );
    if (pruneError) {
      throw new Error(`Prune stale rows failed for ${packId}: ${pruneError.message}`);
    }

    written += rows.length;
    console.log(`  ${packId}: upserted ${rows.length} cards`);
  }
  console.log(`\nUpserted ${written} weight rows across ${packIds.length} packs.`);

  // Read back from the DB and verify parity against the engine.
  const results: PackParity[] = [];
  for (const packId of packIds) {
    const { data, error } = await supabase
      .from("pack_card_weights")
      .select("pack_id, catalog_item_id, item_name, store_rarity, roll_weight, value_gems, image_url")
      .eq("pack_id", packId);
    if (error) throw new Error(`Readback failed for ${packId}: ${error.message}`);
    const dbRows = (data ?? []).map((r) => ({ ...r, roll_weight: Number(r.roll_weight) })) as WeightRow[];
    results.push(verifyParity(packId, dbRows));
  }
  printParityTable(results);
  if (!results.every((r) => r.ok)) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
