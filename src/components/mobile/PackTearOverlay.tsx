import { useMemo } from "react";
import { motion } from "framer-motion";
import { OBSIDIAN_GOLD } from "./mobileTheme";

interface PackTearOverlayProps {
  /** 0 = sealed, 1 = fully torn */
  progress: number;
}

function buildJaggedEdge(progress: number): string {
  const y = 8 + progress * 78;
  const wobble = (i: number) => y + Math.sin(i * 1.7 + progress * 12) * (2 + progress * 4);
  const points = Array.from({ length: 13 }, (_, i) => {
    const x = (i / 12) * 100;
    return `${x},${wobble(i).toFixed(2)}`;
  });
  return `M 0,0 L 100,0 L 100,${y.toFixed(2)} ${points.map((p) => `L ${p}`).join(" ")} L 0,${y.toFixed(2)} Z`;
}

/** Masked SVG tear — visible during 3–7s auto rip or manual drag. */
export function PackTearOverlay({ progress }: PackTearOverlayProps) {
  const clipPath = useMemo(() => buildJaggedEdge(progress), [progress]);
  const lift = progress * 28;

  if (progress <= 0.01) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id="pack-tear-clip">
            <path d={clipPath} />
          </clipPath>
        </defs>
        <rect width="100" height="100" fill="rgba(0,0,0,0.94)" clipPath="url(#pack-tear-clip)" />
        <path
          d={clipPath.replace(" Z", "")}
          fill="none"
          stroke={OBSIDIAN_GOLD.bright}
          strokeOpacity={0.45}
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <motion.div
        className="absolute inset-x-[8%] top-[6%] h-[42%] rounded-lg"
        style={{
          y: -lift,
          background: `linear-gradient(to bottom, ${OBSIDIAN_GOLD.glow}, transparent)`,
        }}
        initial={false}
        animate={{ opacity: 0.12 + progress * 0.55 }}
      />
    </div>
  );
}
