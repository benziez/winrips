/** Rarity → reveal ambient color (no React / theme deps). */
export function getRevealGlowColor(rarity?: string): string {
  const r = (rarity ?? "").toLowerCase();
  if (
    r.includes("ancient") ||
    r.includes("mythic") ||
    r.includes("grail") ||
    r.includes("legendary")
  ) {
    return "rgba(255, 215, 0, 0.72)";
  }
  if (r.includes("epic")) {
    return "rgba(255, 0, 127, 0.62)";
  }
  if (r.includes("rare")) {
    return "rgba(59, 130, 246, 0.55)";
  }
  return "rgba(255, 255, 255, 0.1)";
}

export function getRevealGlowGradient(rarity?: string): string {
  const core = getRevealGlowColor(rarity);
  return `radial-gradient(circle at 50% 42%, ${core} 0%, transparent 70%)`;
}
