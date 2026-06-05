/**
 * Audit local catalog card names against the Pokémon TCG API.
 *
 * Run: npx tsx scripts/auditCardNames.ts
 */
import { ALL_PACK_POKEMON_ITEMS } from "../src/constants/packPokemonPools";
import type { StoreItem } from "../src/types/store";

const API_BASE = "https://api.pokemontcg.io/v2/cards";
const REQUEST_DELAY_MS = 200;

interface UniquePoolCard {
  id: string;
  name: string;
  setId: string;
  number: string;
}

interface NameMismatch {
  localName: string;
  officialName: string;
  setId: string;
  number: string;
  detail?: string;
}

function uniqueBySetAndNumber(items: StoreItem[]): UniquePoolCard[] {
  const byKey = new Map<string, UniquePoolCard>();

  for (const item of items) {
    const setId = item.setId?.trim() ?? "";
    const number = item.number?.trim() ?? "";
    if (!setId || !number) continue;

    const key = `${setId}/${number}`;
    if (byKey.has(key)) continue;

    byKey.set(key, {
      id: item.id,
      name: item.name,
      setId,
      number,
    });
  }

  return [...byKey.values()].sort(
    (a, b) => a.setId.localeCompare(b.setId) || a.number.localeCompare(b.number),
  );
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function padEnd(str: string, width: number): string {
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

function apiCardId(setId: string, number: string): string {
  return `${setId}-${number}`;
}

async function fetchOfficialName(setId: string, number: string): Promise<string | null> {
  const id = encodeURIComponent(apiCardId(setId, number));
  const headers: Record<string, string> = {};
  const apiKey = process.env.POKEMON_TCG_API_KEY?.trim();
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const response = await fetch(`${API_BASE}/${id}`, { headers });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${setId}-${number}`);
  }

  const payload = (await response.json()) as { data?: { name?: string } };
  const name = payload.data?.name?.trim();
  return name || null;
}

function namesMatch(localName: string, officialName: string): boolean {
  const local = normalizeName(localName);
  const official = normalizeName(officialName);
  if (!local || !official) return false;
  return local.includes(official);
}

async function main(): Promise<void> {
  const cards = uniqueBySetAndNumber(ALL_PACK_POKEMON_ITEMS);
  const mismatches: NameMismatch[] = [];

  console.log(`Auditing ${cards.length} unique set/number cards against Pokémon TCG API…\n`);

  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i]!;

    if (i > 0) {
      await sleep(REQUEST_DELAY_MS);
    }

    try {
      const officialName = await fetchOfficialName(card.setId, card.number);

      if (officialName == null) {
        mismatches.push({
          localName: card.name,
          officialName: "(not found)",
          setId: card.setId,
          number: card.number,
          detail: "404",
        });
        continue;
      }

      if (!namesMatch(card.name, officialName)) {
        mismatches.push({
          localName: card.name,
          officialName,
          setId: card.setId,
          number: card.number,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      mismatches.push({
        localName: card.name,
        officialName: "(fetch error)",
        setId: card.setId,
        number: card.number,
        detail: message,
      });
    }
  }

  if (mismatches.length === 0) {
    console.log("All local names contain the official API name.\n");
    return;
  }

  const localWidth = Math.max("Local Name".length, ...mismatches.map((m) => m.localName.length));
  const officialWidth = Math.max(
    "Official API Name".length,
    ...mismatches.map((m) => m.officialName.length),
  );
  const setWidth = Math.max("Set ID".length, ...mismatches.map((m) => m.setId.length));
  const numWidth = Math.max("Number".length, ...mismatches.map((m) => m.number.length));

  console.log(`# Name mismatches (${mismatches.length})\n`);
  console.log(
    `| ${padEnd("Local Name", localWidth)} | ${padEnd("Official API Name", officialWidth)} | ${padEnd("Set ID", setWidth)} | ${padEnd("Number", numWidth)} |`,
  );
  console.log(
    `| ${"-".repeat(localWidth)} | ${"-".repeat(officialWidth)} | ${"-".repeat(setWidth)} | ${"-".repeat(numWidth)} |`,
  );

  for (const row of mismatches) {
    console.log(
      `| ${padEnd(row.localName, localWidth)} | ${padEnd(row.officialName, officialWidth)} | ${padEnd(row.setId, setWidth)} | ${padEnd(row.number, numWidth)} |`,
    );
  }

  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
