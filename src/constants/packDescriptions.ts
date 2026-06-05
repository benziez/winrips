import { normalizePackId } from "./packIdAliases";

const PACK_DETAIL_DESCRIPTIONS: Record<string, string> = {
  "trainers-starter":
    "Your first step into the hobby. Common to Epic pulls — perfect for beginners chasing their first grail.",
  "151-booster-collector":
    "The most iconic set in modern Pokemon. Every pull is a chance at a Charizard ex or Mew ex SAR.",
  "mega-evolution":
    "The era of Mega Pokemon. Alternate arts and full arts from the XY golden age.",
  "legendary-hunt":
    "Alt arts and illustration rares from the SWSH era. Umbreon VMAX is waiting.",
  "shiny-vault":
    "Hidden Fates and Shiny Vault exclusives. Shiny Pokemon only — every card sparkles.",
  "prismatic-sir":
    "Special Illustration Rares from the SV era. The most beautiful cards in the modern game.",
  "evolving-skies":
    "The chase set. Rayquaza VMAX, Umbreon VMAX, and the most sought-after alt arts ever printed.",
  "psa-10-chaser":
    "PSA 10 graded slabs only. Every pull is professionally graded and ready to display or sell.",
  "obsidian-vault":
    "Dark and mysterious. Ultra-rare obsidian-tier cards with some of the highest values on the platform.",
  "god-pack-1999":
    "The holy grail. Base Set, Jungle, and Fossil era cards. Could be a $10,000 pull.",
  "wotc-first-edition":
    "The most valuable cards ever printed. 1st Edition WOTC holos — up to $25,000 est. top pull.",
  "waifu-vault":
    "Trainer Gallery exclusives. The rarest trainer cards from SWSH sets.",
  "power-hour":
    "One hour. One shot at a grail. Every pull during Power Hour has boosted Mythic pull rates.",
  "midnight-grail":
    "The rarest pulls only come out at night. Vintage and dark-type chase cards, 12–1AM only.",
  flash: "Blink and you'll miss it. Modern illustration rares with boosted Epic pull rates.",
  "weekend-warrior":
    "Your weekend reward. The best pull rates of the week, Saturday and Sunday only.",
  "infinite-prime":
    "Infinite Series entry — 30 curated hits with a 77/18/5 floor, mid, and grail split.",
  "infinite-apex":
    "Elevated Infinite Series — stronger mid-tier market value and tighter grail ceiling.",
  "infinite-zenith":
    "Near-peak Infinite Series — vintage grails blended with modern alt-art chase cards.",
  "infinite-omega":
    "Flagship Infinite Series — maximum grail ceiling with WOTC 1st Edition chase hits.",
};

const DEFAULT_PACK_DETAIL_DESCRIPTION =
  "Each pack contains one graded card — ship it to your door, or sell it back at 85% of Fair Market Value with our buyback guarantee.";

export function getPackDetailDescription(packId: string): string {
  const normalized = normalizePackId(packId.trim());
  return PACK_DETAIL_DESCRIPTIONS[normalized] ?? DEFAULT_PACK_DETAIL_DESCRIPTION;
}
