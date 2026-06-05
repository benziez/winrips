import type { Pack, PackCategory } from "../types";
import type { StoreItem } from "../types/store";
import { POKEMON_FLOOR_CARD_ART } from "./pokemonFloorCards";
import { SPORTS_PLACEHOLDER_IMAGE } from "./sportsAssets";

const YUGIOH_FLOOR_IMAGE = "images/yugioh-card-back.svg";

const FLOOR_NAME_TEMPLATES: Record<PackCategory, readonly string[]> = {
  pokemon: POKEMON_FLOOR_CARD_ART.map((card) => card.name),
  nba: [
    "Base Rookie Bulk",
    "Hoops Common Lot",
    "Press Pass Insert",
    "Team Set Filler",
    "Bench Player Base",
  ],
  nfl: [
    "Donruss Base Bulk",
    "Panini Base Common",
    "Practice Squad RC",
    "Team Logo Insert",
    "Game Day Base Lot",
  ],
  mlb: [
    "Topps Base Bulk",
    "Bowman Paper Common",
    "Spring Training Issue",
    "Minor League Call-Up",
    "Clubhouse Set Filler",
  ],
  ufc: [
    "Base Fighter Card",
    "Event Program Insert",
    "Contender Series Common",
    "Weigh-In Photo Card",
    "Octagon Stats Card",
  ],
  yugioh: [
    "Common Spell Bulk",
    "Starter Deck Filler",
    "Promo Common Lot",
    "Duelist Pack Common",
    "Bulk Trap Card",
  ],
};

function floorImageForCategory(category: PackCategory, index = 0): string {
  if (category === "yugioh") return YUGIOH_FLOOR_IMAGE;
  if (category === "pokemon") {
    return POKEMON_FLOOR_CARD_ART[index % POKEMON_FLOOR_CARD_ART.length]!.image;
  }
  return SPORTS_PLACEHOLDER_IMAGE;
}

function floorCardMetaForCategory(category: PackCategory, index: number) {
  if (category !== "pokemon") return null;
  return POKEMON_FLOOR_CARD_ART[index % POKEMON_FLOOR_CARD_ART.length]!;
}

function floorIdPrefix(category: PackCategory): string {
  return category === "pokemon" ? "pk-floor" : "floor";
}

/** Deterministic 4–5 filler count per pack — heavier floor mass stabilizes house edge. */
export function floorFillerCountForPack(packId: string): number {
  const hash = [...packId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 4 + (hash % 2);
}

/**
 * Per-pack floor tuning overrides — keeps EV inside the 10–12% house-edge band
 * for packs whose card pool can't reach target with the default ratios/share.
 * `ratioMin/ratioMax` set floor-filler gem values as a fraction of spin cost;
 * `share` overrides the floor mass target used during EV calibration.
 * These only adjust POOL data, so displayed odds always recompute to match the engine.
 */
export interface PackFloorOverride {
  ratioMin?: number;
  ratioMax?: number;
  share?: number;
  /** Grail probability cap override — lets the calibrator pump high-value chase cards. */
  grailMaxProbability?: number;
  /** Grail probability floor override — prevents calibrator from draining below target (e.g. 0.05%). */
  grailMinProbability?: number;
}

export const PACK_FLOOR_OVERRIDES: Record<string, PackFloorOverride> = {
  // Starter pack — ~$0.40 EV at $1 price; keep floor mass low so calibration can hit target.
  "trainers-starter": {
    share: 0.72,
    grailMaxProbability: 2.5,
    grailMinProbability: 0.35,
  },
  // EV was -6.3% (loss): floor commons were too rich → lower them to land ~12%.
  "psa-10-chaser": { ratioMin: 0.44, ratioMax: 0.52 },
  // EV was 8.9% (just under band): trim floor slightly to land in 10–12%.
  "obsidian-vault": { ratioMin: 0.7, ratioMax: 0.79 },
  // EV was 45.2% margin: mids are below the floor, so lift EV via the high-value
  // mythic chase cards (raise grail cap) rather than the floor.
  "mega-evolution": { grailMaxProbability: 6 },
  // EV was 41.0% margin: the whole value ladder was raised/ordered to fit the $45
  // price; a modest grail-cap bump lets the SIR mythics carry the tail to ~12%.
  "prismatic-sir": { grailMaxProbability: 4 },
  // EV was 25.4% margin: raise floor value + mass to reach ~12%.
  "waifu-vault": { ratioMin: 0.74, ratioMax: 0.86, share: 0.85 },
  // $150 pack — cap grails at 0.05%; floor mass tuned for ~12% house edge at $150.
  "god-pack-1999": {
    grailMaxProbability: 0.05,
    grailMinProbability: 0.05,
    ratioMin: 0.97,
    ratioMax: 1.028,
    share: 0.874,
  },
  "wotc-first-edition": {
    grailMaxProbability: 0.05,
    grailMinProbability: 0.05,
    ratioMin: 0.97,
    ratioMax: 1.028,
    share: 0.834,
  },
  // Infinite Series — authored 77/18/5 tier split (23 floor + 5 mid + 2 grail slots).
  "infinite-prime": { share: 0.77, grailMaxProbability: 5, grailMinProbability: 0.5 },
  "infinite-apex": { share: 0.77, grailMaxProbability: 5, grailMinProbability: 0.5 },
  "infinite-zenith": { share: 0.77, grailMaxProbability: 5, grailMinProbability: 0.5 },
  "infinite-omega": { share: 0.77, grailMaxProbability: 5, grailMinProbability: 0.5 },
};

/** Floor mass target override for a pack, if any (else engine default). */
export function packFloorShareOverride(packId: string): number | undefined {
  return PACK_FLOOR_OVERRIDES[packId]?.share;
}

/** Grail probability cap override for a pack, if any (else engine default). */
export function packGrailMaxOverride(packId: string): number | undefined {
  return PACK_FLOOR_OVERRIDES[packId]?.grailMaxProbability;
}

/** Grail probability floor override for a pack, if any (else engine default). */
export function packGrailMinOverride(packId: string): number | undefined {
  return PACK_FLOOR_OVERRIDES[packId]?.grailMinProbability;
}

function floorGemValues(spinCost: number, count: number, packId?: string): number[] {
  let minRatio = 0.12;
  let maxRatio = 0.18;

  if (spinCost >= 25_000) {
    minRatio = 0.74;
    maxRatio = 0.84;
  } else if (spinCost >= 10_000) {
    minRatio = 0.72;
    maxRatio = 0.82;
  } else if (spinCost >= 4_000) {
    minRatio = 0.62;
    maxRatio = 0.72;
  } else if (spinCost >= 2_500) {
    minRatio = 0.55;
    maxRatio = 0.68;
  } else if (spinCost >= 1_000) {
    minRatio = 0.55;
    maxRatio = 0.68;
  } else if (spinCost >= 250) {
    minRatio = 0.18;
    maxRatio = 0.26;
  }

  const override = packId ? PACK_FLOOR_OVERRIDES[packId] : undefined;
  if (override?.ratioMin !== undefined) minRatio = override.ratioMin;
  if (override?.ratioMax !== undefined) maxRatio = override.ratioMax;

  const minGems = Math.max(1, Math.round(spinCost * minRatio));
  const maxGems = Math.max(minGems + 1, Math.round(spinCost * maxRatio));

  if (count <= 1) return [Math.round((minGems + maxGems) / 2)];

  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    return Math.round(minGems + t * (maxGems - minGems));
  });
}

/** Build Common floor fillers worth 10–20% of the box spin cost. */
export function createFloorFillerItems(
  pack: Pick<Pack, "id" | "name" | "cost" | "category">,
): StoreItem[] {
  const count = floorFillerCountForPack(pack.id);
  const values = floorGemValues(pack.cost, count, pack.id);
  const names = FLOOR_NAME_TEMPLATES[pack.category];
  const prefix = floorIdPrefix(pack.category);

  return values.map((value, index) => {
    const cardMeta = floorCardMetaForCategory(pack.category, index);
    const image = floorImageForCategory(pack.category, index);

    return {
      id: `${prefix}-${pack.id}-${String(index + 1).padStart(2, "0")}`,
      name: cardMeta?.name ?? `${names[index % names.length]} (${pack.name})`,
      rarity: "Common" as const,
      appRarity: "Common" as const,
      value,
      image,
      probability: 0,
      tcgMarketUsd: Math.round((value / 100) * 100) / 100,
      setId: cardMeta?.setId ?? pack.category,
      setName: cardMeta?.setName ?? `${pack.name} Floor`,
      number: cardMeta?.number ?? `F${String(index + 1).padStart(2, "0")}`,
    };
  });
}

const floorFillersByPackId = new Map<string, StoreItem[]>();
const floorFillersByCategory = new Map<PackCategory, StoreItem[]>();

export function isFloorFillerItemId(itemId: string): boolean {
  return itemId.includes("-floor-");
}

export function registerPackFloorFillers(packId: string, items: StoreItem[]): void {
  floorFillersByPackId.set(packId, items);
}

export function getFloorFillersForPackId(packId: string): StoreItem[] {
  return floorFillersByPackId.get(packId) ?? [];
}

export function getFloorFillersByCategory(category: PackCategory): StoreItem[] {
  return floorFillersByCategory.get(category) ?? [];
}

export function rebuildFloorFillerRegistry(packs: readonly Pick<Pack, "id" | "name" | "cost" | "category">[]): void {
  floorFillersByPackId.clear();
  floorFillersByCategory.clear();

  for (const pack of packs) {
    const fillers = createFloorFillerItems(pack);
    registerPackFloorFillers(pack.id, fillers);

    const categoryList = floorFillersByCategory.get(pack.category) ?? [];
    categoryList.push(...fillers);
    floorFillersByCategory.set(pack.category, categoryList);
  }
}
