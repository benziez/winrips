import type { VaultedCard } from "../types";
import { GOD_PACK_1999_POOL, LEGENDARY_HUNT_POOL } from "./packPokemonPools";
import { storeItemToCard } from "./packPokemonPools";

/** Premium catalog assets available as upgrade targets. */
export function buildUpgraderTargets(): VaultedCard[] {
  const pool = [...LEGENDARY_HUNT_POOL, ...GOD_PACK_1999_POOL]
    .filter((item) => item.value >= 8_000)
    .sort((a, b) => b.value - a.value);

  const seen = new Set<string>();
  const targets: VaultedCard[] = [];

  for (const item of pool) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const card = storeItemToCard(item);
    targets.push({
      vaultId: `upgrade-target-${item.id}`,
      id: card.id,
      name: card.name,
      rarity: card.rarity,
      value: card.value,
      image: card.image,
      acquiredAt: "Premium catalog",
    });
    if (targets.length >= 10) break;
  }

  return targets;
}

export const UPGRADER_TARGET_POOL = buildUpgraderTargets();
