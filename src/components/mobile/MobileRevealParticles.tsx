import { useMemo } from "react";
import { motion } from "framer-motion";
import type { StoreRarity } from "../../types/store";
import { getStoreRevealGlowColor } from "../../utils/revealGlow";
import type { RevealParticleScope } from "../../utils/revealPayoff";

interface ParticleSpec {
  id: number;
  angle: number;
  distance: number;
  delay: number;
  size: number;
}

function buildSpecs(count: number): ParticleSpec[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    angle: (id / count) * Math.PI * 2 + (id % 5) * 0.11,
    distance: 28 + (id % 7) * 9 + (id % 3) * 6,
    delay: (id / count) * 0.38,
    size: 2.2 + (id % 4) * 0.85,
  }));
}

interface MobileRevealParticlesProps {
  count: number;
  storeRarity: StoreRarity;
  scope: RevealParticleScope;
}

export function MobileRevealParticles({
  count,
  storeRarity,
  scope,
}: MobileRevealParticlesProps) {
  const specs = useMemo(() => buildSpecs(count), [count]);
  const fill = getStoreRevealGlowColor(storeRarity);
  const useGpu = count > 40;

  if (count <= 0 || scope === "none") return null;

  const containerClass =
    scope === "card"
      ? "pointer-events-none absolute inset-0 z-[12] overflow-visible"
      : "pointer-events-none absolute inset-0 z-[12] overflow-visible";

  return (
    <div className={containerClass} aria-hidden>
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={useGpu ? { willChange: "transform" } : undefined}
      >
        {specs.map((particle) => {
          const endX = 50 + Math.cos(particle.angle) * particle.distance;
          const endY = 50 + Math.sin(particle.angle) * particle.distance;

          return (
            <motion.circle
              key={particle.id}
              r={particle.size}
              fill={fill}
              initial={{ cx: 50, cy: 50, opacity: 0.95, scale: 1 }}
              animate={{ cx: endX, cy: endY, opacity: 0, scale: 0.35 }}
              transition={{
                duration: 0.95,
                delay: particle.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={useGpu ? { willChange: "transform, opacity" } : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}
