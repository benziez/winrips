import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type { BattleRank } from "../../../utils/packBattleRank";
import { BattleRankBadge } from "./BattleRankBadge";

const CELEBRATION_MS = 2_500;

interface ConfettiParticle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

function RankConfetti({ color }: { color: string }) {
  const particles = useMemo<ConfettiParticle[]>(
    () =>
      Array.from({ length: 28 }).map((_, id) => ({
        id,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 1.4 + Math.random() * 1.1,
        size: 3 + Math.random() * 5,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.left}%`,
            top: "-4%",
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}88`,
          }}
          initial={{ y: 0, opacity: 0.85, rotate: 0 }}
          animate={{ y: "105vh", opacity: 0, rotate: 180 + Math.random() * 180 }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export function BattleRankUpCelebration({
  rank,
  onComplete,
}: {
  rank: BattleRank;
  onComplete: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, CELEBRATION_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-black px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <RankConfetti color={rank.accentColor} />

      <motion.p
        className="relative z-10 text-center text-[44px] font-black leading-none tracking-tight sm:text-[52px]"
        style={{ color: rank.accentColor }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        {rank.label}
      </motion.p>

      <motion.p
        className="relative z-10 mt-4 text-[13px] font-medium tracking-[0.2em] text-white/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.15 }}
      >
        New Rank Unlocked
      </motion.p>

      <motion.div
        className="relative z-10 mt-8"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.35 }}
      >
        <BattleRankBadge rank={rank} size="md" showTrophy />
      </motion.div>
    </motion.div>
  );
}
