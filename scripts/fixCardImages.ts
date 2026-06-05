/**
 * One-time audit: compare packPokemonPools defineItem numbers against Pokémon TCG API.
 *
 * Run: npx ts-node scripts/fixCardImages.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POOL_FILE = join(__dirname, "../src/constants/packPokemonPools.ts");
const REPORT_FILE = join(__dirname, "cardImageAudit.txt");

const DEFINE_ITEM_RE =
  /defineItem\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"[^"]*"\s*,\s*"([^"]+)"/g;

const API_BASE = "https://api.pokemontcg.io/v2/cards";
const REQUEST_DELAY_MS = 220;

interface PoolCard {
  id: string;
  name: string;
  setId: string;
  number: string;
}

interface ApiCard {
  name: string;
  number: string;
  set: { id: string };
}

function parseDefineItems(source: string): PoolCard[] {
  const cards: PoolCard[] = [];
  for (const match of source.matchAll(DEFINE_ITEM_RE)) {
    cards.push({
      id: match[1]!,
      name: match[2]!,
      setId: match[3]!,
      number: match[4]!,
    });
  }
  return cards;
}

function tcgImageUrl(setId: string, number: string): string {
  return `https://images.pokemontcg.io/${setId}/${number}_hires.png`;
}

function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[—–]/g, "-")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchApiCards(name: string, setId: string): Promise<ApiCard[]> {
  const q = `name:"${escapeQueryValue(name)}" set.id:${setId}`;
  const url = `${API_BASE}?${new URLSearchParams({ q, pageSize: "20", select: "name,number,set.id" })}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${name} (${setId})`);
  }

  const payload = (await response.json()) as { data?: ApiCard[] };
  return payload.data ?? [];
}

function pickBestMatch(cards: ApiCard[], poolName: string): ApiCard | null {
  if (cards.length === 0) return null;

  const exact = cards.filter((c) => c.name === poolName);
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) return exact[0]!;

  const normalized = normalizeName(poolName);
  const loose = cards.filter((c) => normalizeName(c.name) === normalized);
  if (loose.length >= 1) return loose[0]!;

  return cards[0] ?? null;
}

async function main(): Promise<void> {
  const source = readFileSync(POOL_FILE, "utf8");
  const poolCards = parseDefineItems(source);

  const lines: string[] = [
    "Pokémon TCG card image audit",
    `Source: ${POOL_FILE}`,
    `Generated: ${new Date().toISOString()}`,
    `Total defineItem entries: ${poolCards.length}`,
    "",
    "Format (corrections): id | name | current number | correct number | correct image URL",
    "",
  ];

  let okCount = 0;
  let correctionCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (let i = 0; i < poolCards.length; i += 1) {
    const card = poolCards[i]!;
    const prefix = `[${i + 1}/${poolCards.length}]`;

    try {
      const apiCards = await fetchApiCards(card.name, card.setId);
      const match = pickBestMatch(apiCards, card.name);

      if (!match) {
        notFoundCount += 1;
        lines.push(
          `NOT FOUND | ${card.id} | ${card.name} | setId=${card.setId} | current=#${card.number}`,
        );
        console.log(`${prefix} NOT FOUND  ${card.id}  ${card.name}`);
      } else if (match.number !== card.number) {
        correctionCount += 1;
        const url = tcgImageUrl(card.setId, match.number);
        lines.push(
          `${card.id} | ${card.name} | ${card.number} | ${match.number} | ${url}`,
        );
        console.log(
          `${prefix} CORRECTION ${card.id} | ${card.name} | ${card.number} -> ${match.number} | ${url}`,
        );
      } else {
        okCount += 1;
        lines.push(`OK | ${card.id} | ${card.name} | #${card.number}`);
      }
    } catch (error) {
      errorCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      lines.push(`ERROR | ${card.id} | ${card.name} | ${message}`);
      console.log(`${prefix} ERROR      ${card.id}  ${message}`);
    }

    if (i < poolCards.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  lines.push("");
  lines.push("=== SUMMARY ===");
  lines.push(`OK: ${okCount}`);
  lines.push(`CORRECTIONS NEEDED: ${correctionCount}`);
  lines.push(`NOT FOUND: ${notFoundCount}`);
  lines.push(`ERRORS: ${errorCount}`);

  writeFileSync(REPORT_FILE, `${lines.join("\n")}\n`, "utf8");

  console.log("");
  console.log("=== SUMMARY ===");
  console.log(`OK: ${okCount}`);
  console.log(`CORRECTIONS NEEDED: ${correctionCount}`);
  console.log(`NOT FOUND: ${notFoundCount}`);
  console.log(`ERRORS: ${errorCount}`);
  console.log(`Report written to ${REPORT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
