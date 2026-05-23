import type { CardDetailCard } from "../types/cardDetail";

function marketUsdNote(usd: number | undefined): string {
  if (usd == null || usd <= 0) {
    return "Pricing is indexed to authenticated collector sales across major marketplaces.";
  }
  if (usd >= 500) {
    return `Recent authenticated comps exceed $${Math.round(usd).toLocaleString()} USD.`;
  }
  if (usd >= 100) {
    return `Tracked comps trade above $${Math.round(usd).toLocaleString()} USD in graded markets.`;
  }
  if (usd >= 25) {
    return `Verified sales cluster near $${usd.toFixed(0)} USD across major exchanges.`;
  }
  if (usd >= 5) {
    return `Steady collector demand with comps around $${usd.toFixed(2)} USD.`;
  }
  if (usd >= 1) {
    return `A reliable floor slot with comps near $${usd.toFixed(2)} USD.`;
  }
  return "A volume floor slot that keeps entry pools accessible while preserving authentic pulls.";
}

export function buildCardMarketReference(card: CardDetailCard): string {
  const setLabel = card.setName?.trim() || "verified marketplaces";
  const usdNote = marketUsdNote(card.tcgMarketUsd);
  const cardRef = card.number?.trim()
    ? `${card.name} (#${card.number.trim()})`
    : card.name;

  if (card.appRarity === "Ancient Rare" || card.rarity === "Mythic") {
    return `Grail-tier centerpiece from ${setLabel}. ${usdNote} ${cardRef} anchors the ceiling of this drop table and remains one of the most sought-after pulls in the pool.`;
  }
  if (card.rarity === "Legendary") {
    return `Premium chase from ${setLabel}. ${usdNote} ${cardRef} is a headline pull that collectors watch closely in live auction and buy-it-now channels.`;
  }
  if (card.rarity === "Epic") {
    return `High-end slot from ${setLabel}. ${usdNote} ${cardRef} delivers strong mid-to-high tier value for vault collectors building around this set.`;
  }
  if (card.rarity === "Rare") {
    return `Solid mid-tier collectible from ${setLabel}. ${usdNote} ${cardRef} offers dependable upside without the volatility of top-end grails.`;
  }
  return `Floor-tier slot from ${setLabel}. ${usdNote} ${cardRef} keeps the pool balanced while still representing authentic, market-referenced inventory.`;
}
