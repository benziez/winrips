import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Card } from "../../../types";
import type { StoreRarity } from "../../../types/store";
import { CollectibleImage } from "../../ui/CollectibleImage";
import { glowPaletteForStoreRarity } from "../../../utils/rarityGlowColors";
import type { RarityGlowPalette } from "../../../utils/rarityGlowColors";
import { formatUsd, gemsToUsd } from "../../../constants/retail";

const STORE_RARITY_RANK: Record<StoreRarity, number> = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  Mythic: 4,
};

interface RevealTier {
  rank: number;
  auraOpacity: number;
  auraScale: number;
  showRays: boolean;
  showSparkles: boolean;
  fromScale: number;
  stiffness: number;
  damping: number;
}

function revealTierForRarity(rarity: StoreRarity): RevealTier {
  const rank = STORE_RARITY_RANK[rarity] ?? 0;
  const high = rank >= 3;
  return {
    rank,
    auraOpacity: 0.22 + rank * 0.12,
    auraScale: 1 + rank * 0.06,
    showRays: high,
    showSparkles: high,
    fromScale: rank >= 3 ? 0.35 : rank >= 1 ? 0.5 : 0.62,
    stiffness: rank >= 3 ? 420 : 320,
    damping: rank >= 3 ? 17 : 22,
  };
}

function FlashBurst() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-[3] h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9), transparent 60%)" }}
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: [0, 0.85, 0], scale: [0.2, 1.4, 1.9] }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
}

function RevealAura({ palette, tier }: { palette: RarityGlowPalette; tier: RevealTier }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        background: `radial-gradient(circle at 50% 45%, rgba(${palette.rgb}, ${tier.auraOpacity}), transparent 70%)`,
        filter: "blur(6px)",
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: tier.auraScale }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
}

function WinnerPulseGlow() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[42%] z-0 h-[85%] w-[95%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgba(236,72,153,0.55) 0%, rgba(239,68,68,0.35) 45%, transparent 72%)",
        filter: "blur(10px)",
      }}
      animate={{ opacity: [0.45, 0.85, 0.45], scale: [0.92, 1.06, 0.92] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function LightRays({ palette }: { palette: RarityGlowPalette }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2"
      style={{
        background: `repeating-conic-gradient(from 0deg at 50% 50%, rgba(${palette.rgb}, 0.16) 0deg, transparent 7deg 22deg)`,
        maskImage: "radial-gradient(circle, black 0%, transparent 62%)",
        WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 62%)",
      }}
      initial={{ opacity: 0, rotate: 0 }}
      animate={{ opacity: 1, rotate: 360 }}
      transition={{
        opacity: { duration: 0.6, ease: "easeOut" },
        rotate: { duration: 26, repeat: Infinity, ease: "linear" },
      }}
    />
  );
}

function Sparkles({ palette }: { palette: RarityGlowPalette }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        size: 3 + Math.random() * 4,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            backgroundColor: palette.needle,
            boxShadow: `0 0 8px ${palette.needle}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 1.4, delay: d.delay, repeat: Infinity, repeatDelay: 0.7 }}
        />
      ))}
    </div>
  );
}

function CountUpValue({
  valueGems,
  durationMs = 800,
  glowTone,
}: {
  valueGems: number;
  durationMs?: number;
  glowTone: "win" | "loss" | "neutral";
}) {
  const [displayGems, setDisplayGems] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayGems(valueGems * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, valueGems]);

  const glowStyle =
    glowTone === "win"
      ? { textShadow: "0 0 12px rgba(242,214,128,0.55), 0 0 24px rgba(236,72,153,0.35)" }
      : glowTone === "loss"
        ? { textShadow: "0 0 12px rgba(248,113,113,0.5), 0 0 22px rgba(239,68,68,0.3)" }
        : undefined;

  return (
    <span
      className="text-base font-bold tabular-nums text-[var(--rip-green-bright)]"
      style={glowStyle}
    >
      {formatUsd(gemsToUsd(displayGems))}
    </span>
  );
}

export function BattleCardReveal({
  card,
  rarity,
  label,
  compact = false,
  isWinner = false,
  valueGlow = "loss",
}: {
  card: Card;
  rarity: StoreRarity;
  label: string;
  compact?: boolean;
  isWinner?: boolean;
  valueGlow?: "win" | "loss" | "neutral";
}) {
  const palette = glowPaletteForStoreRarity(rarity);
  const tier = revealTierForRarity(rarity);

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-xs font-medium uppercase tracking-widest text-white/40">
        {label}
      </p>
      <div
        className={`relative flex items-center justify-center ${
          compact ? "w-[min(40vw,150px)]" : "w-[min(72vw,340px)]"
        }`}
      >
        {isWinner ? <WinnerPulseGlow /> : null}
        <RevealAura palette={palette} tier={tier} />
        {tier.showRays ? <LightRays palette={palette} /> : null}
        {tier.showSparkles ? <Sparkles palette={palette} /> : null}
        <FlashBurst />
        <motion.div
          className={`relative z-[2] ${compact ? "w-[min(34vw,130px)]" : "w-[min(58vw,300px)]"}`}
          initial={{ scale: tier.fromScale, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: tier.stiffness, damping: tier.damping }}
        >
          <CollectibleImage
            src={card.image}
            alt={card.name}
            className="w-full object-contain"
            priority
            optimize={false}
            forceShow
          />
        </motion.div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="max-w-[150px] truncate text-center text-lg font-bold leading-tight text-white">
          {card.name}
        </p>
        <CountUpValue valueGems={card.value} glowTone={valueGlow} />
      </div>
    </div>
  );
}

export function BattleRevealDuel({
  userCard,
  botCard,
  userRarity,
  botRarity,
  botLabel,
  outcome,
}: {
  userCard: Card;
  botCard: Card;
  userRarity: StoreRarity;
  botRarity: StoreRarity;
  botLabel: string;
  outcome: "win" | "loss" | "tie";
}) {
  const isTie = outcome === "tie";
  const userIsWinner = !isTie && outcome === "win";
  const botIsWinner = !isTie && outcome === "loss";
  const valueGlowForSide = (winner: boolean): "win" | "loss" | "neutral" => {
    if (isTie) return "neutral";
    return winner ? "win" : "loss";
  };

  return (
    <div className="relative flex w-full max-w-xl items-start justify-center gap-3 px-1">
      <BattleCardReveal
        card={userCard}
        rarity={userRarity}
        label="YOU"
        compact
        isWinner={userIsWinner}
        valueGlow={valueGlowForSide(userIsWinner)}
      />

      <div className="pointer-events-none absolute left-1/2 top-[38%] z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
        <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/25 to-transparent" />
        <span className="text-[11px] font-black tracking-[0.35em] text-white/50">VS</span>
        <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/25 to-transparent" />
      </div>

      <BattleCardReveal
        card={botCard}
        rarity={botRarity}
        label={botLabel}
        compact
        isWinner={botIsWinner}
        valueGlow={valueGlowForSide(botIsWinner)}
      />
    </div>
  );
}
