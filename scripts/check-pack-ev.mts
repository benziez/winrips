import { buildPokemonPacks } from "../src/constants/packs.ts";
import { initializePackFloorEconomy } from "../src/constants/packEconomy.ts";
import { getPackStoreItems } from "../src/constants/catalog.ts";
import {
  computePackExpectedValue,
  expectedValueBounds,
  targetPackExpectedValue,
} from "../src/utils/packProbability.ts";

const packs = initializePackFloorEconomy(buildPokemonPacks());

for (const pack of packs) {
  const items = getPackStoreItems(pack);
  const ev = computePackExpectedValue(items);
  const { min, max } = expectedValueBounds(pack.cost);
  const target = targetPackExpectedValue(pack.cost);
  const edge = ((1 - ev / pack.cost) * 100).toFixed(2);
  const grails = items.filter(
    (i) => i.rarity === "Mythic" || i.rarity === "Legendary",
  );
  console.log(
    `${pack.id}: cost=${pack.cost} EV=${ev.toFixed(2)} target=${target.toFixed(0)} band=${min.toFixed(0)}-${max.toFixed(0)} edge=${edge}%`,
  );
  grails.slice(0, 3).forEach((g) =>
    console.log(`  grail ${g.name}: ${g.probability.toFixed(3)}% @ ${g.value}`),
  );
}
