/**
 * Audit gross profit margins for every active pack in `boxes`, using live
 * `pack_card_weights` (same weighted EV as `open_pack` — standard rip, not risky).
 *
 *   npx tsx scripts/auditProfitMargins.ts
 *   npx tsx scripts/auditProfitMargins.ts --pack=god-pack-1999
 *
 * Env (.env): SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gemsToUsd, formatUsd } from "../src/constants/retail";
import {
  computePackExpectedValue,
  PROBABILITY_TOTAL,
} from "../src/utils/packProbability";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

interface BoxRow {
  id: string;
  name: string;
  cost: number;
}

interface WeightRow {
  pack_id: string;
  roll_weight: number;
  value_gems: number;
}

interface AuditRow {
  packId: string;
  name: string;
  priceUsd: number;
  evUsd: number;
  marginPct: number;
  cardCount: number;
  missingWeights: boolean;
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
    /* no .env — rely on ambient process.env */
  }
}

function parsePackFilter(): string | null {
  const arg = process.argv.find((a) => a.startsWith("--pack="));
  return arg?.split("=")[1]?.trim() || null;
}

/** EV in gems — normalized roll_weight × value_gems (matches open_pack draw weights). */
function expectedValueGemsFromWeights(rows: WeightRow[]): number | null {
  const total = rows.reduce((sum, row) => sum + row.roll_weight, 0);
  if (total <= 0) return null;
  const weighted = rows.map((row) => ({
    probability: (row.roll_weight / total) * PROBABILITY_TOTAL,
    value: Math.max(0, Math.round(row.value_gems)),
  }));
  return computePackExpectedValue(weighted);
}

function grossProfitMarginPct(priceUsd: number, evUsd: number): number {
  if (priceUsd <= 0) return 0;
  return ((priceUsd - evUsd) / priceUsd) * 100;
}

function padEnd(str: string, width: number): string {
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

function padStart(str: string, width: number): string {
  return str.length >= width ? str : " ".repeat(width - str.length) + str;
}

function fmtPct(pct: number): string {
  if (!Number.isFinite(pct)) return "N/A";
  return `${pct.toFixed(2)}%`;
}

function displayName(row: AuditRow): string {
  if (row.missingWeights) return `${row.name} (no weights)`;
  if (row.marginPct < 0) return `${row.name} ⚠ LOSS`;
  return row.name;
}

function highlightLoss(text: string, losing: boolean): string {
  return losing ? `${RED}${BOLD}${text}${RESET}` : text;
}

function auditRow(box: BoxRow, weights: WeightRow[]): AuditRow {
  const priceUsd = gemsToUsd(box.cost);
  const evGems = expectedValueGemsFromWeights(weights);
  const missingWeights = evGems === null;
  const evUsd = missingWeights ? 0 : gemsToUsd(evGems);
  const marginPct = missingWeights ? NaN : grossProfitMarginPct(priceUsd, evUsd);

  return {
    packId: box.id,
    name: box.name,
    priceUsd,
    evUsd,
    marginPct,
    cardCount: weights.length,
    missingWeights,
  };
}

async function main(): Promise<void> {
  loadEnvFromFile();

  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (set in .env).",
    );
  }

  const packFilter = parsePackFilter();
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let boxQuery = supabase
    .from("boxes")
    .select("id, name, cost")
    .eq("is_active", true)
    .order("cost", { ascending: true });

  if (packFilter) {
    boxQuery = boxQuery.eq("id", packFilter);
  }

  const { data: boxes, error: boxError } = await boxQuery;
  if (boxError) {
    throw new Error(`boxes read failed: ${boxError.message}`);
  }

  const activeBoxes = (boxes ?? []) as BoxRow[];
  if (activeBoxes.length === 0) {
    console.log(packFilter ? `No active box found for id "${packFilter}".` : "No active packs in boxes.");
    return;
  }

  const packIds = activeBoxes.map((b) => b.id);
  const { data: weightData, error: weightError } = await supabase
    .from("pack_card_weights")
    .select("pack_id, roll_weight, value_gems")
    .in("pack_id", packIds);

  if (weightError) {
    throw new Error(`pack_card_weights read failed: ${weightError.message}`);
  }

  const weightsByPack = new Map<string, WeightRow[]>();
  for (const packId of packIds) weightsByPack.set(packId, []);

  for (const raw of weightData ?? []) {
    const row = raw as WeightRow;
    const list = weightsByPack.get(row.pack_id);
    if (!list) continue;
    list.push({
      pack_id: row.pack_id,
      roll_weight: Number(row.roll_weight),
      value_gems: Number(row.value_gems),
    });
  }

  const rows = activeBoxes.map((box) => auditRow(box, weightsByPack.get(box.id) ?? []));
  const losers = rows.filter((r) => !r.missingWeights && r.marginPct < 0);
  const noWeights = rows.filter((r) => r.missingWeights);

  const nameWidth = Math.max("Pack Name".length, ...rows.map((r) => displayName(r).length));
  const moneyWidth = 14;
  const pctWidth = 12;

  console.log("# Pack Profit Margin Audit\n");
  console.log(
    "Source: active `boxes` + `pack_card_weights` (EV = Σ (roll_weight / Σw) × value_gems). " +
      "Margin = (price − EV) / price. 100 gems = $1.\n",
  );

  const header = `| ${padEnd("Pack Name", nameWidth)} | ${padStart("Pack Price", moneyWidth)} | ${padStart("Avg Payout (EV)", moneyWidth)} | ${padStart("Gross Margin", pctWidth)} |`;
  console.log(header);
  console.log(
    `| ${"-".repeat(nameWidth)} | ${"-".repeat(moneyWidth)} | ${"-".repeat(moneyWidth)} | ${"-".repeat(pctWidth)} |`,
  );

  for (const row of rows) {
    const losing = !row.missingWeights && row.marginPct < 0;
    const nameCell = padEnd(displayName(row), nameWidth);
    const priceCell = padStart(formatUsd(row.priceUsd), moneyWidth);
    const evCell = row.missingWeights
      ? padStart("N/A", moneyWidth)
      : padStart(formatUsd(row.evUsd), moneyWidth);
    const marginCell = row.missingWeights
      ? padStart("N/A", pctWidth)
      : padStart(fmtPct(row.marginPct), pctWidth);

    console.log(
      `| ${highlightLoss(nameCell, losing || row.missingWeights)} | ${priceCell} | ${highlightLoss(evCell, losing)} | ${highlightLoss(marginCell, losing)} |`,
    );
  }

  console.log("");
  if (losers.length > 0) {
    console.log(
      `${RED}${BOLD}${losers.length} pack(s) with NEGATIVE gross margin (EV exceeds price):${RESET}`,
    );
    for (const row of losers) {
      console.log(
        `  • ${row.name} (${row.packId}): price ${formatUsd(row.priceUsd)}, EV ${formatUsd(row.evUsd)}, margin ${fmtPct(row.marginPct)}`,
      );
    }
  } else {
    console.log("All weighted packs have non-negative gross margin.");
  }

  if (noWeights.length > 0) {
    console.log(`\n${RED}${noWeights.length} active pack(s) missing roll weights:${RESET}`);
    for (const row of noWeights) {
      console.log(`  • ${row.name} (${row.packId})`);
    }
    process.exitCode = 1;
  }

  if (losers.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
