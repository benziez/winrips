import type { Pack, PackCategory } from "../types";
import type { StoreItem } from "../types/store";
import { POKEMON_FLOOR_CARD_ART } from "./pokemonFloorCards";
import { SPORTS_PLACEHOLDER_IMAGE } from "./sportsAssets";

const YUGIOH_FLOOR_IMAGE = "/images/yugioh-card-back.svg";

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

function floorGemValues(spinCost: number, count: number): number[] {
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
  const values = floorGemValues(pack.cost, count);
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
