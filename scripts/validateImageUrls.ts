/**
 * Validate Pokémon TCG CDN image URLs for every card in packPokemonPools.
 *
 * Run: npx tsx scripts/validateImageUrls.ts
 */
import type { StoreItem } from "../src/types/store";
import { ALL_PACK_POKEMON_ITEMS } from "../src/constants/packPokemonPools";

const CDN_BASE = "https://images.pokemontcg.io";
const CONCURRENCY = 8;
const REQUEST_TIMEOUT_MS = 15_000;

function tcgImageUrl(setId: string, number: string): string {
  return `${CDN_BASE}/${setId}/${number}.png`;
}

function padEnd(str: string, width: number): string {
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

function padStart(str: string, width: number): string {
  return str.length >= width ? str : " ".repeat(width - str.length) + str;
}

interface CardProbe {
  id: string;
  name: string;
  setId: string;
  number: string;
  url: string;
}

interface BrokenCard extends CardProbe {
  status: number | "error";
  detail: string;
}

function uniqueCards(items: StoreItem[]): CardProbe[] {
  const seen = new Set<string>();
  const cards: CardProbe[] = [];

  for (const item of items) {
    const setId = item.setId?.trim() ?? "";
    const number = item.number?.trim() ?? "";
    if (!setId || !number) continue;

    const key = `${setId}/${number}`;
    if (seen.has(key)) continue;
    seen.add(key);

    cards.push({
      id: item.id,
      name: item.name,
      setId,
      number,
      url: tcgImageUrl(setId, number),
    });
  }

  return cards;
}

async function headCheck(url: string): Promise<{ ok: boolean; status: number | "error"; detail: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    if (res.ok) {
      return { ok: true, status: res.status, detail: "OK" };
    }

    return {
      ok: false,
      status: res.status,
      detail: res.statusText || `HTTP ${res.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, status: "error", detail: message };
  } finally {
    clearTimeout(timer);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await fn(items[index]!, index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main(): Promise<void> {
  const cards = uniqueCards(ALL_PACK_POKEMON_ITEMS);
  console.log(`Checking ${cards.length} unique image URLs (${ALL_PACK_POKEMON_ITEMS.length} pool rows)…\n`);

  const broken: BrokenCard[] = [];

  await mapWithConcurrency(cards, CONCURRENCY, async (card) => {
    const result = await headCheck(card.url);
    if (!result.ok) {
      broken.push({
        ...card,
        status: result.status,
        detail: result.detail,
      });
    }
    return result;
  });

  broken.sort((a, b) => a.setId.localeCompare(b.setId) || a.number.localeCompare(b.number));

  if (broken.length === 0) {
    console.log("All image URLs returned HTTP 2xx.\n");
    return;
  }

  const nameWidth = Math.max("Card Name".length, ...broken.map((c) => c.name.length));
  const setWidth = Math.max("Set ID".length, ...broken.map((c) => c.setId.length));
  const numWidth = Math.max("Number".length, ...broken.map((c) => c.number.length));
  const statusWidth = Math.max("Status".length, ...broken.map((c) => String(c.status).length));

  console.log(`# Broken Pokémon TCG Image URLs (${broken.length})\n`);
  console.log(
    `| ${padEnd("Card Name", nameWidth)} | ${padEnd("Set ID", setWidth)} | ${padStart("Number", numWidth)} | ${padStart("Status", statusWidth)} | Detail |`,
  );
  console.log(
    `| ${"-".repeat(nameWidth)} | ${"-".repeat(setWidth)} | ${"-".repeat(numWidth)} | ${"-".repeat(statusWidth)} | --- |`,
  );

  for (const row of broken) {
    console.log(
      `| ${padEnd(row.name, nameWidth)} | ${padEnd(row.setId, setWidth)} | ${padStart(row.number, numWidth)} | ${padStart(String(row.status), statusWidth)} | ${row.detail} |`,
    );
  }

  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
