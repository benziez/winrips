/**
 * Fix catalog display names and image URLs in packPokemonPools.ts using the
 * Pokémon TCG API (setId + number are source of truth).
 *
 * Every matched card is written with an explicit API `_hires.png` image URL.
 *
 * Run: npx tsx scripts/fixCatalogNames.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POOL_FILE = join(__dirname, "../src/constants/packPokemonPools.ts");

const API_BASE = "https://api.pokemontcg.io/v2/cards";
const REQUEST_DELAY_MS = 200;
const FETCH_TIMEOUT_MS = 20_000;

/** Matches defineItem with optional explicit image URL after number. */
const DEFINE_ITEM_LINE_RE =
  /defineItem\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"([^"]+)"(?:\s*,\s*"((?:https?:\/\/[^"\\]|\\.)*)")?\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g;

/** Wrong set id in catalog → correct API lookup (Brilliant Stars TG lives in swsh9tg). */
const API_LOOKUP_ALIASES: Record<string, { setId: string; number: string }> = {
  "swsh9/TG22": { setId: "swsh9tg", number: "TG22" },
};

/** Hard-coded fallbacks when the API id lookup still fails after aliasing. */
const MANUAL_OFFICIAL_CARDS: Record<string, { name: string; imageUrl: string; setId?: string; setName?: string }> = {
  "swsh9/TG22": {
    name: "Umbreon V",
    setId: "swsh9tg",
    setName: "Brilliant Stars Trainer Gallery",
    imageUrl: "https://images.pokemontcg.io/swsh9tg/TG22_hires.png",
  },
  "swsh9tg/TG22": {
    name: "Umbreon V",
    imageUrl: "https://images.pokemontcg.io/swsh9tg/TG22_hires.png",
  },
};

function escapeTsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(localName: string, officialName: string): boolean {
  const local = normalizeName(localName);
  const official = normalizeName(officialName);
  if (!local || !official) return false;
  return local.includes(official);
}

/** Preserve em-dash tails (e.g. " — PSA 10") and common display tags (SIR, Full Art, …). */
function extractPreservedSuffix(localName: string): string {
  const emDash = localName.match(/\s*[—–]\s+(.+)$/);
  if (emDash) return ` — ${emDash[1].trim()}`;

  const trailing = localName.match(
    /\s+((?:ex\s+)?SIR|SAR|Full Art|Alt Art|Alt|ex SAR|1st Ed Holo|1st Ed|Holo)$/i,
  );
  if (trailing) return ` ${trailing[1]}`;

  return "";
}

function buildCorrectedName(localName: string, officialName: string): string {
  if (namesMatch(localName, officialName)) return localName;

  const suffix = extractPreservedSuffix(localName);
  return `${officialName}${suffix}`;
}

/** Require canonical Pokémon TCG CDN `_hires.png` URLs (no derived `.png` shortcuts). */
function canonicalHiresImageUrl(imageUrl: string, setId: string, number: string): string {
  const trimmed = imageUrl.trim();
  if (/_hires\.png$/i.test(trimmed)) return trimmed;
  if (/\.png$/i.test(trimmed)) return trimmed.replace(/\.png$/i, "_hires.png");
  return `https://images.pokemontcg.io/${setId}/${number}_hires.png`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function apiCardId(setId: string, number: string): string {
  return `${setId}-${number}`;
}

function resolveApiLookup(setId: string, number: string): { setId: string; number: string } {
  const key = `${setId}/${number}`;
  return API_LOOKUP_ALIASES[key] ?? { setId, number };
}

interface OfficialCard {
  name: string;
  imageUrl: string;
  setId?: string;
  setName?: string;
}

async function fetchOfficialCard(setId: string, number: string): Promise<OfficialCard | null> {
  const lookup = resolveApiLookup(setId, number);
  const manualKey = `${setId}/${number}`;
  const manual = MANUAL_OFFICIAL_CARDS[manualKey] ?? MANUAL_OFFICIAL_CARDS[`${lookup.setId}/${lookup.number}`];
  if (manual) {
    return {
      name: manual.name,
      imageUrl: canonicalHiresImageUrl(manual.imageUrl, lookup.setId, lookup.number),
      setId: manual.setId,
      setName: manual.setName,
    };
  }

  const id = encodeURIComponent(apiCardId(lookup.setId, lookup.number));
  const headers: Record<string, string> = {};
  const apiKey = process.env.POKEMON_TCG_API_KEY?.trim();
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      headers,
      signal: controller.signal,
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${lookup.setId}-${lookup.number}`);
    }

    const payload = (await response.json()) as {
      data?: { name?: string; images?: { large?: string; small?: string } };
    };
    const name = payload.data?.name?.trim();
    const rawImage =
      payload.data?.images?.large?.trim() ?? payload.data?.images?.small?.trim() ?? "";
    if (!name || !rawImage) return null;

    return {
      name,
      imageUrl: canonicalHiresImageUrl(rawImage, lookup.setId, lookup.number),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`timeout after ${FETCH_TIMEOUT_MS}ms for ${lookup.setId}-${lookup.number}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

interface PoolEntry {
  id: string;
  name: string;
  setId: string;
  setName: string;
  number: string;
  imageUrl?: string;
  rarity: string;
  appRarity: string;
  value: number;
  probability: number;
  tcgMarketUsd: number;
}

function parseDefineItemLine(match: RegExpMatchArray): PoolEntry {
  return {
    id: match[1]!,
    name: match[2]!.replace(/\\"/g, '"'),
    setId: match[3]!,
    setName: match[4]!.replace(/\\"/g, '"'),
    number: match[5]!,
    imageUrl: match[6]?.replace(/\\"/g, '"'),
    rarity: match[7]!,
    appRarity: match[8]!,
    value: Number(match[9]),
    probability: Number(match[10]),
    tcgMarketUsd: Number(match[11]),
  };
}

function formatDefineItemLine(entry: PoolEntry, imageUrl: string): string {
  return (
    `defineItem("${entry.id}", "${escapeTsString(entry.name)}", "${entry.setId}", ` +
    `"${escapeTsString(entry.setName)}", "${entry.number}", ` +
    `"${escapeTsString(imageUrl)}", "${entry.rarity}", "${entry.appRarity}", ` +
    `${entry.value}, ${entry.probability}, ${entry.tcgMarketUsd})`
  );
}

async function main(): Promise<void> {
  const source = readFileSync(POOL_FILE, "utf8");
  const entries: PoolEntry[] = [];
  for (const match of source.matchAll(DEFINE_ITEM_LINE_RE)) {
    entries.push(parseDefineItemLine(match));
  }

  const uniqueKeys = [...new Set(entries.map((e) => `${e.setId}/${e.number}`))].sort();
  const officialByKey = new Map<string, OfficialCard | null>();

  console.log(
    `Fetching official names + _hires image URLs for ${uniqueKeys.length} unique set/number pairs…\n`,
  );

  for (let i = 0; i < uniqueKeys.length; i += 1) {
    const key = uniqueKeys[i]!;
    const [setId, number] = key.split("/");
    const progress = `[${i + 1}/${uniqueKeys.length}]`;
    const lookup = resolveApiLookup(setId!, number!);

    console.log(`${progress} fetching ${lookup.setId}-${lookup.number}…`);

    if (i > 0) await sleep(REQUEST_DELAY_MS);

    try {
      const official = await fetchOfficialCard(setId!, number!);
      officialByKey.set(key, official);
      if (!official) {
        console.warn(`${progress} skip ${lookup.setId}-${lookup.number} — API 404 or missing image`);
      } else {
        console.log(
          `${progress} ok ${lookup.setId}-${lookup.number} → "${official.name}" | ${official.imageUrl}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`${progress} skip ${lookup.setId}-${lookup.number} — ${message}`);
      officialByKey.set(key, null);
    }
  }

  let updatedNames = 0;
  let updatedImages = 0;
  let rewritten = 0;
  let unchanged = 0;
  let skipped = 0;

  const newSource = source.replace(
    DEFINE_ITEM_LINE_RE,
    (full, g1, g2, g3, g4, g5, g6, g7, g8, g9, g10, g11) => {
      const match = [full, g1, g2, g3, g4, g5, g6, g7, g8, g9, g10, g11] as RegExpMatchArray;
      const entry = parseDefineItemLine(match);
      const key = `${entry.setId}/${entry.number}`;
      const official = officialByKey.get(key);

      if (official == null) {
        skipped += 1;
        return full;
      }

      const nextEntry: PoolEntry = {
        ...entry,
        name: buildCorrectedName(entry.name, official.name),
        setId: official.setId ?? entry.setId,
        setName: official.setName ?? entry.setName,
      };
      const hiresUrl = canonicalHiresImageUrl(official.imageUrl, nextEntry.setId, nextEntry.number);

      const nameChanged = nextEntry.name !== entry.name;
      const setChanged = nextEntry.setId !== entry.setId || nextEntry.setName !== entry.setName;
      const imageChanged = (entry.imageUrl ?? "").trim() !== hiresUrl;

      if (!nameChanged && !setChanged && !imageChanged) {
        unchanged += 1;
        return full;
      }

      rewritten += 1;
      if (nameChanged) updatedNames += 1;
      if (imageChanged || !entry.imageUrl) updatedImages += 1;

      return formatDefineItemLine(nextEntry, hiresUrl);
    },
  );

  writeFileSync(POOL_FILE, newSource, "utf8");

  console.log("\n=== SUMMARY ===");
  console.log(`Lines rewritten: ${rewritten}`);
  console.log(`Name updates: ${updatedNames}`);
  console.log(`Image updates: ${updatedImages}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Skipped (no API card): ${skipped}`);
  console.log(`Wrote ${POOL_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
