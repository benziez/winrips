/**
 * Refresh card prices in Supabase from the Pokémon TCG API (TCGplayer market).
 *
 * Default: dry-run (logs before/after only). Pass --apply to write updates.
 *
 *   npx tsx scripts/update_card_prices.ts
 *   npx tsx scripts/update_card_prices.ts --apply
 *   npx tsx scripts/update_card_prices.ts --limit=20
 *
 * If public.cards does not exist yet, use pack_card_weights (deduped by catalog_item_id):
 *   npx tsx scripts/update_card_prices.ts --table=pack_card_weights
 *
 * Env (.env): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: POKEMON_TCG_API_KEY
 *
 * Table/column overrides:
 *   CARDS_TABLE=cards (default; or --table=pack_card_weights)
 *   CARDS_COL_ID=id
 *   CARDS_COL_NAME=name
 *   CARDS_COL_SET_ID=set_id
 *   CARDS_COL_NUMBER=number
 *   CARDS_COL_PRICE=price
 *   CARDS_COL_IMAGE=image_url
 *   PRICE_UNIT=gems|usd  (default: gems — 100 gems = $1)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = "https://api.pokemontcg.io/v2/cards";
const REQUEST_DELAY_MS = 220;
const PAGE_SIZE = 500;
const GEMS_PER_USD = 100;

const APPLY = process.argv.includes("--apply");
const DRY_RUN = !APPLY;
const LIMIT = parsePositiveIntFlag("limit");
const ONLY_CHANGED = !process.argv.includes("--all");

const TABLE =
  process.argv.find((a) => a.startsWith("--table="))?.split("=")[1]?.trim() ||
  process.env.CARDS_TABLE?.trim() ||
  "cards";

const COL =
  TABLE === "pack_card_weights"
    ? {
        id: process.env.CARDS_COL_ID?.trim() || "catalog_item_id",
        name: process.env.CARDS_COL_NAME?.trim() || "item_name",
        setId: process.env.CARDS_COL_SET_ID?.trim() || "set_id",
        number: process.env.CARDS_COL_NUMBER?.trim() || "number",
        price: process.env.CARDS_COL_PRICE?.trim() || "value_gems",
        image: process.env.CARDS_COL_IMAGE?.trim() || "image_url",
      }
    : {
        id: process.env.CARDS_COL_ID?.trim() || "id",
        name: process.env.CARDS_COL_NAME?.trim() || "name",
        setId: process.env.CARDS_COL_SET_ID?.trim() || "set_id",
        number: process.env.CARDS_COL_NUMBER?.trim() || "number",
        price: process.env.CARDS_COL_PRICE?.trim() || "price",
        image: process.env.CARDS_COL_IMAGE?.trim() || "image_url",
      };
const PRICE_UNIT = (process.env.PRICE_UNIT?.trim() || "gems").toLowerCase() as
  | "gems"
  | "usd";

/** Wrong catalog set/number → API lookup (mirrors fixCatalogNames.ts). */
const API_LOOKUP_ALIASES: Record<string, { setId: string; number: string }> = {
  "swsh9/TG22": { setId: "swsh9tg", number: "TG22" },
};

interface TcgPriceVariant {
  market?: number | null;
  mid?: number | null;
  low?: number | null;
  high?: number | null;
  directLow?: number | null;
}

interface ApiCard {
  id: string;
  name: string;
  number: string;
  set?: { id: string; name: string };
  tcgplayer?: {
    updatedAt?: string;
    prices?: Record<string, TcgPriceVariant>;
  };
}

/** Preferred finish order when multiple TCGplayer variants exist (highest relevance first). */
const TCGPLAYER_VARIANT_PRIORITY = [
  "holofoil",
  "reverseHolofoil",
  "normal",
  "1stEditionHolofoil",
  "1stEditionNormal",
  "unlimitedHolofoil",
  "unlimited",
] as const;

interface DbCardRow {
  id: string;
  name: string;
  setId: string;
  number: string;
  price: number | null;
  imageUrl: string;
}

interface PriceUpdatePlan {
  row: DbCardRow;
  marketUsd: number;
  priceVariant: string;
  newPrice: number;
  apiCardId: string;
  tcgplayerUpdatedAt: string | null;
}

function parsePositiveIntFlag(flag: string): number | null {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  if (!arg) return null;
  const value = Number(arg.split("=")[1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
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
    /* rely on process.env */
  }
}

function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSetNumberFromImageUrl(imageUrl: string): { setId: string; number: string } | null {
  const match = /images\.pokemontcg\.io\/([^/]+)\/([^/_]+)/i.exec(imageUrl);
  if (!match) return null;
  return { setId: match[1]!, number: match[2]! };
}

function resolveApiLookup(setId: string, number: string): { setId: string; number: string } {
  const key = `${setId}/${number}`;
  return API_LOOKUP_ALIASES[key] ?? { setId, number };
}

function parseUsd(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Pull tcgplayer block from API card (handles odd partial select payloads). */
function resolveTcgplayer(card: ApiCard | Record<string, unknown>): {
  updatedAt: string | null;
  prices: Record<string, TcgPriceVariant>;
} | null {
  const raw = card as Record<string, unknown>;
  const tcg =
    raw.tcgplayer && typeof raw.tcgplayer === "object"
      ? (raw.tcgplayer as Record<string, unknown>)
      : null;
  if (!tcg) return null;

  const pricesRaw = tcg.prices;
  if (!pricesRaw || typeof pricesRaw !== "object") {
    return {
      updatedAt: typeof tcg.updatedAt === "string" ? tcg.updatedAt : null,
      prices: {},
    };
  }

  const prices: Record<string, TcgPriceVariant> = {};
  for (const [key, variant] of Object.entries(pricesRaw as Record<string, unknown>)) {
    if (!variant || typeof variant !== "object") continue;
    const v = variant as Record<string, unknown>;
    prices[key] = {
      market: parseUsd(v.market) ?? undefined,
      mid: parseUsd(v.mid) ?? undefined,
      low: parseUsd(v.low) ?? undefined,
      high: parseUsd(v.high) ?? undefined,
      directLow: parseUsd(v.directLow) ?? undefined,
    };
  }

  return {
    updatedAt: typeof tcg.updatedAt === "string" ? tcg.updatedAt : null,
    prices,
  };
}

/** Best USD from variant: market → mid → directLow → low. */
function variantUsd(variant: TcgPriceVariant): number | null {
  return (
    parseUsd(variant.market) ??
    parseUsd(variant.mid) ??
    parseUsd(variant.directLow) ??
    parseUsd(variant.low)
  );
}

/**
 * Highest TCGplayer market (or mid fallback) across all known finish buckets.
 * @returns [usd, variantKey] or null
 */
function getMarketUsdFromTcgplayer(
  tcgplayer: ReturnType<typeof resolveTcgplayer>,
): [number, string] | null {
  if (!tcgplayer || Object.keys(tcgplayer.prices).length === 0) return null;

  const { prices } = tcgplayer;
  let bestUsd: number | null = null;
  let bestKey = "";

  const orderedKeys = [
    ...TCGPLAYER_VARIANT_PRIORITY.filter((k) => k in prices),
    ...Object.keys(prices).filter(
      (k) => !TCGPLAYER_VARIANT_PRIORITY.includes(k as (typeof TCGPLAYER_VARIANT_PRIORITY)[number]),
    ),
  ];

  for (const key of orderedKeys) {
    const usd = variantUsd(prices[key]!);
    if (usd == null) continue;
    if (bestUsd == null || usd > bestUsd) {
      bestUsd = usd;
      bestKey = key;
    }
  }

  return bestUsd == null ? null : [bestUsd, bestKey];
}

function getMarketUsd(card: ApiCard): [number, string] | null {
  return getMarketUsdFromTcgplayer(resolveTcgplayer(card));
}

function marketUsdToStoredPrice(marketUsd: number): number {
  if (PRICE_UNIT === "usd") {
    return Math.round(marketUsd * 100) / 100;
  }
  return Math.max(1, Math.round(marketUsd * GEMS_PER_USD));
}

function formatPriceLabel(value: number): string {
  if (PRICE_UNIT === "usd") return `$${value.toFixed(2)}`;
  return `${value} gems ($${(value / GEMS_PER_USD).toFixed(2)})`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickBestMatch(cards: ApiCard[], poolName: string, number: string): ApiCard | null {
  if (cards.length === 0) return null;

  const byNumber = cards.filter((c) => c.number === number);
  if (byNumber.length === 1) return byNumber[0]!;
  if (byNumber.length > 1) {
    const exactName = byNumber.filter((c) => c.name === poolName);
    if (exactName.length >= 1) return exactName[0]!;
    return byNumber[0]!;
  }

  const exact = cards.filter((c) => c.name === poolName);
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) return exact[0]!;

  const normalized = normalizeName(poolName);
  const loose = cards.filter((c) => normalizeName(c.name) === normalized);
  if (loose.length >= 1) return loose[0]!;

  return cards[0] ?? null;
}

async function fetchApiCards(
  name: string,
  setId: string,
  number: string,
  apiKey: string | undefined,
): Promise<ApiCard[]> {
  const lookup = resolveApiLookup(setId, number);
  const q = number
    ? `set.id:${lookup.setId} number:"${escapeQueryValue(lookup.number)}"`
    : `name:"${escapeQueryValue(name)}" set.id:${lookup.setId}`;

  const url = new URL(API_BASE);
  url.searchParams.set("q", q);
  url.searchParams.set("pageSize", "20");
  // Must request full `tcgplayer` — dot-notation select (tcgplayer.prices) strips nested prices.
  url.searchParams.set("select", "id,name,number,set.id,set.name,tcgplayer");

  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`TCG API HTTP ${response.status} for q=${q}`);
  }

  const payload = (await response.json()) as { data?: ApiCard[] };
  return payload.data ?? [];
}

function rowFromRecord(record: Record<string, unknown>): DbCardRow | null {
  const id = String(record[COL.id] ?? "").trim();
  const name = String(record[COL.name] ?? "").trim();
  if (!id || !name) return null;

  let setId = String(record[COL.setId] ?? "").trim();
  let number = String(record[COL.number] ?? "").trim();
  const imageUrl = String(record[COL.image] ?? "").trim();

  if ((!setId || !number) && imageUrl) {
    const parsed = parseSetNumberFromImageUrl(imageUrl);
    if (parsed) {
      setId = setId || parsed.setId;
      number = number || parsed.number;
    }
  }

  const rawPrice = record[COL.price];
  const price =
    rawPrice == null || rawPrice === ""
      ? null
      : Number(rawPrice);

  return {
    id,
    name,
    setId,
    number,
    price: Number.isFinite(price) ? price : null,
    imageUrl,
  };
}

async function fetchFromPackCardWeights(supabase: SupabaseClient): Promise<DbCardRow[]> {
  const byCatalogId = new Map<string, DbCardRow>();
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("pack_card_weights")
      .select(`${COL.id}, ${COL.name}, ${COL.price}, ${COL.image}, updated_at`)
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to read pack_card_weights: ${error.message}`);
    }

    const batch = (data ?? []) as Record<string, unknown>[];
    for (const record of batch) {
      const row = rowFromRecord(record);
      if (!row || byCatalogId.has(row.id)) continue;
      byCatalogId.set(row.id, row);
    }

    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return [...byCatalogId.values()];
}

async function fetchAllCards(supabase: SupabaseClient): Promise<DbCardRow[]> {
  if (TABLE === "pack_card_weights") {
    return fetchFromPackCardWeights(supabase);
  }

  const rows: DbCardRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .range(from, to);

    if (error) {
      throw new Error(
        `Failed to read ${TABLE}: ${error.message}. If you do not have public.cards yet, run with --table=pack_card_weights or set CARDS_TABLE=pack_card_weights.`,
      );
    }

    const batch = (data ?? []) as Record<string, unknown>[];
    for (const record of batch) {
      const row = rowFromRecord(record);
      if (row) rows.push(row);
    }

    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
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
      "Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (set in .env or environment).",
    );
  }

  const apiKey = process.env.POKEMON_TCG_API_KEY?.trim();
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Mode: ${DRY_RUN ? "DRY RUN (pass --apply to write)" : "APPLY"}`);
  console.log(`Table: public.${TABLE}`);
  console.log(`Price column: ${COL.price} (${PRICE_UNIT})`);
  console.log(`Only rows with price changes: ${ONLY_CHANGED ? "yes" : "no (--all)"}`);
  if (LIMIT) console.log(`Limit: ${LIMIT} cards`);
  console.log("");

  const cards = await fetchAllCards(supabase);
  const workset = LIMIT ? cards.slice(0, LIMIT) : cards;
  console.log(`Loaded ${cards.length} row(s) from Supabase; processing ${workset.length}.\n`);

  const plans: PriceUpdatePlan[] = [];
  let skippedNoLookup = 0;
  let skippedNoMarket = 0;
  let apiErrors = 0;
  let unchanged = 0;

  for (let i = 0; i < workset.length; i += 1) {
    const row = workset[i]!;
    const prefix = `[${i + 1}/${workset.length}] ${row.id}`;

    if (!row.setId) {
      skippedNoLookup += 1;
      console.warn(`${prefix} SKIP — missing ${COL.setId} (and could not parse ${COL.image})`);
      continue;
    }

    try {
      const apiCards = await fetchApiCards(row.name, row.setId, row.number, apiKey);
      const match = pickBestMatch(apiCards, row.name, row.number);

      if (!match) {
        skippedNoLookup += 1;
        console.warn(
          `${prefix} SKIP — no API match for name="${row.name}" set=${row.setId} #${row.number || "?"}`,
        );
      } else {
        const tcgplayer = resolveTcgplayer(match);
        const marketResult = getMarketUsdFromTcgplayer(tcgplayer);
        if (marketResult == null) {
          skippedNoMarket += 1;
          const variantKeys = tcgplayer ? Object.keys(tcgplayer.prices).join(", ") : "(none)";
          console.warn(
            `${prefix} SKIP — no TCGplayer market/mid price (API id ${match.id}, variants: ${variantKeys || "missing tcgplayer"})`,
          );
        } else {
          const [marketUsd, priceVariant] = marketResult;
          const newPrice = marketUsdToStoredPrice(marketUsd);
          const before = row.price;
          const changed = before === null || Math.abs(before - newPrice) >= 0.005;

          if (!changed && ONLY_CHANGED) {
            unchanged += 1;
          } else {
            plans.push({
              row,
              marketUsd,
              priceVariant,
              newPrice,
              apiCardId: match.id,
              tcgplayerUpdatedAt: tcgplayer?.updatedAt ?? null,
            });

            const beforeLabel =
              before === null ? "(null)" : formatPriceLabel(before);
            const afterLabel = formatPriceLabel(newPrice);
            console.log(
              `${prefix} ${row.name} | ${row.setId}/${row.number || match.number} | ${beforeLabel} → ${afterLabel} | API ${match.id} ${priceVariant} $${marketUsd.toFixed(2)}`,
            );
          }
        }
      }
    } catch (error) {
      apiErrors += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${prefix} API ERROR — ${message}`);
    }

    if (i < workset.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Processed: ${workset.length}`);
  console.log(`Updates planned: ${plans.length}`);
  console.log(`Unchanged (skipped): ${unchanged}`);
  console.log(`No API match: ${skippedNoLookup}`);
  console.log(`No market price: ${skippedNoMarket}`);
  console.log(`API errors: ${apiErrors}`);

  if (plans.length === 0) {
    console.log("\nNothing to update.");
    return;
  }

  if (DRY_RUN) {
    console.log("\nDry run complete — no database writes. Re-run with --apply to persist.");
    return;
  }

  console.log("\nApplying updates…");
  let applied = 0;
  let failed = 0;

  for (const plan of plans) {
    let errorMessage: string | null = null;

    if (TABLE === "pack_card_weights") {
      const { error } = await supabase
        .from("pack_card_weights")
        .update({ [COL.price]: plan.newPrice })
        .eq(COL.id, plan.row.id);
      if (error) errorMessage = error.message;
    } else {
      const { error } = await supabase
        .from(TABLE)
        .update({ [COL.price]: plan.newPrice })
        .eq(COL.id, plan.row.id);
      if (error) errorMessage = error.message;
    }

    if (errorMessage) {
      failed += 1;
      console.error(`FAILED ${plan.row.id}: ${errorMessage}`);
    } else {
      applied += 1;
    }
  }

  console.log(`\nApplied: ${applied} | Failed: ${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
