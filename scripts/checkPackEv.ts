import { LOBBY_PACK_CATALOG } from "../src/constants/packs";
import { getPackStoreItems } from "../src/constants/catalog";
import { isFloorFillerItemId } from "../src/constants/floorFillers";
import {
  computePackExpectedValue,
  expectedValueBounds,
  targetPackExpectedValue,
} from "../src/utils/packProbability";
import { getPackDropTable } from "../src/data/packDropTables";

const packIds = process.argv.slice(2);
const targets = packIds.length > 0 ? packIds : ["god-pack-1999", "wotc-first-edition"];

for (const id of targets) {
  const pack = LOBBY_PACK_CATALOG.find((p) => p.id === id);
  if (!pack) continue;
  const items = getPackStoreItems(pack);
  const ev = computePackExpectedValue(items);
  const bounds = expectedValueBounds(pack.cost);
  const target = targetPackExpectedValue(pack.cost);
  const floors = items.filter((i) => isFloorFillerItemId(i.id));
  const floorEv = floors.reduce((sum, f) => sum + (f.probability / 100) * f.value, 0);
  console.log(`\n${id}  cost=${pack.cost}  EV=${ev.toFixed(0)}  target=${target.toFixed(0)}  band=${bounds.min.toFixed(0)}–${bounds.max.toFixed(0)}`);
  console.log(`  floor EV=${floorEv.toFixed(0)}  floorShare=${floors.reduce((s, f) => s + f.probability, 0).toFixed(1)}%  floorValues=${floors.map((f) => f.value).join(",")}`);
  const grails = getPackDropTable(id)
    .filter((e) => e.storeRarity === "Mythic" || e.card.value >= 500_000)
    .sort((a, b) => b.card.value - a.card.value)
    .slice(0, 6);
  for (const g of grails) {
    console.log(`  ${g.card.name}: ${g.probability.toFixed(4)}% ($${(g.card.value / 100).toFixed(0)})`);
  }
}
