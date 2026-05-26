import { getRevealGlowGradient } from "../../utils/revealGlow";

/** Obsidian & Gold — accent palette (never use as full-bleed fills). */
export const OBSIDIAN_GOLD = {
  base: "#D4AF37",
  bright: "#F2D680",
  glow: "rgba(212, 175, 55, 0.45)",
  hairline: "rgba(255, 255, 255, 0.1)",
} as const;

/** Premium mobile design system — absolute black + glassmorphism. */
export const MOBILE_COLORS = {
  canvas: "#000000",
  textPrimary: "#FFFFFF",
  /** Zinc-400 — metadata, odds, labels */
  textMuted: "#A1A1AA",
  /** @deprecated Prefer OBSIDIAN_GOLD for new UI; kept for existing imports */
  accent: "#FF007F",
  gold: OBSIDIAN_GOLD.base,
  goldBright: OBSIDIAN_GOLD.bright,
  grailGold: "#FFD700",
} as const;

/** Rarity → ambient glow color (presentation tokens). */
export const RARITY_GLOW_COLOR: Record<string, string> = {
  grail: "rgba(242, 214, 128, 0.72)",
  mythic: "rgba(242, 214, 128, 0.68)",
  ancient: "rgba(242, 214, 128, 0.65)",
  legendary: "rgba(212, 175, 55, 0.62)",
  epic: "rgba(255, 0, 127, 0.55)",
  rare: "rgba(59, 130, 246, 0.5)",
  default: "rgba(255, 255, 255, 0.08)",
};

export function rarityGlowColor(rarity?: string): string {
  const r = (rarity ?? "").toLowerCase();
  if (r.includes("grail") || r.includes("mythic") || r.includes("ancient")) {
    return RARITY_GLOW_COLOR.grail;
  }
  if (r.includes("legendary")) return RARITY_GLOW_COLOR.legendary;
  if (r.includes("epic")) return RARITY_GLOW_COLOR.epic;
  if (r.includes("rare")) return RARITY_GLOW_COLOR.rare;
  return RARITY_GLOW_COLOR.default;
}

export function rarityGlowGradient(rarity?: string): string {
  const core = rarityGlowColor(rarity);
  return `radial-gradient(circle at 50% 42%, ${core} 0%, transparent 70%)`;
}

/** Glass layer — composes from single CSS primitive (see index.css). */
export const GLASS = "obsidian-glass";

export const GLASS_DOCK = "obsidian-glass-dock";

/** @deprecated Use GLASS */
export const FLOAT_GLASS = GLASS;

/** @deprecated Use GLASS_DOCK */
export const FLOAT_GLASS_DARK = GLASS_DOCK;

export const BTN_PRIMARY =
  "w-full rounded-full border border-[#D4AF37] bg-white/5 py-4 text-center text-[15px] font-bold tracking-wide text-[#F2D680] shadow-[0_0_40px_rgba(212,175,55,0.22)] transition-transform active:scale-[0.98] disabled:opacity-40";

export const BTN_GHOST =
  "rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors active:bg-white/5";

export const PAGE_STACK_SPRING = {
  type: "spring" as const,
  damping: 34,
  stiffness: 380,
  mass: 0.82,
};

/** Full-screen rarity ambient (revealing phase). */
export function rarityRevealGlow(rarity?: string): string {
  return getRevealGlowGradient(rarity);
}

/** Ghost CTA — 1px white border per Triumph spec. */
export const BTN_GHOST_OUTLINE =
  "rounded-full border border-white bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors active:bg-white/5";
