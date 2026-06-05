import { useEffect, useMemo, useState, type CSSProperties } from "react";

const SHOOTING_STAR_SLOTS = 3;

type StarFieldTierId = "budget" | "mid" | "high" | "elite";

interface TierConfig {
  id: StarFieldTierId;
  background: string;
  starColors: string[];
  starCount: number;
  shootDelayMinMs: number;
  shootDelayMaxMs: number;
  twinkleDurationMin: number;
  twinkleDurationMax: number;
  twinkleDelayMax: number;
  showGlowPulse: boolean;
  glowGradient: string;
  shootingStarPeakOpacity: number;
}

interface StarDot {
  id: number;
  left: number;
  top: number;
  size: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
}

interface ActiveShootingStar {
  key: number;
  top: number;
  left: number;
  duration: number;
  color: string;
  peakOpacity: number;
}

interface StarFieldProps {
  packPrice: number;
  className?: string;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function resolveTier(packPrice: number): TierConfig {
  const price = Number.isFinite(packPrice) && packPrice >= 0 ? packPrice : 0;

  if (price >= 50) {
    return {
      id: "elite",
      background: "#1a0000",
      starColors: ["#ef4444", "#fbbf24"],
      starCount: 250,
      shootDelayMinMs: 1000,
      shootDelayMaxMs: 3000,
      twinkleDurationMin: 0.8,
      twinkleDurationMax: 2,
      twinkleDelayMax: 3,
      showGlowPulse: true,
      glowGradient:
        "radial-gradient(ellipse at center, rgba(239, 68, 68, 0.28) 0%, rgba(251, 191, 36, 0.16) 38%, transparent 72%)",
      shootingStarPeakOpacity: 1,
    };
  }

  if (price >= 20) {
    return {
      id: "high",
      background: "#0f0800",
      starColors: ["#fbbf24", "#f97316"],
      starCount: 200,
      shootDelayMinMs: 2000,
      shootDelayMaxMs: 4000,
      twinkleDurationMin: 1.4,
      twinkleDurationMax: 3.2,
      twinkleDelayMax: 4,
      showGlowPulse: true,
      glowGradient:
        "radial-gradient(ellipse at center, rgba(251, 191, 36, 0.18) 0%, rgba(249, 115, 22, 0.08) 42%, transparent 72%)",
      shootingStarPeakOpacity: 0.85,
    };
  }

  if (price >= 5) {
    return {
      id: "mid",
      background: "#030a1f",
      starColors: ["#a78bfa", "#60a5fa"],
      starCount: 150,
      shootDelayMinMs: 4000,
      shootDelayMaxMs: 6000,
      twinkleDurationMin: 2,
      twinkleDurationMax: 4.5,
      twinkleDelayMax: 5,
      showGlowPulse: false,
      glowGradient: "",
      shootingStarPeakOpacity: 0.75,
    };
  }

  return {
    id: "budget",
    background: "#0a0015",
    starColors: ["#ffffff"],
    starCount: 100,
    shootDelayMinMs: 6000,
    shootDelayMaxMs: 8000,
    twinkleDurationMin: 3.5,
    twinkleDurationMax: 6.5,
    twinkleDelayMax: 6,
    showGlowPulse: false,
    glowGradient: "",
    shootingStarPeakOpacity: 0.65,
  };
}

/** Background color for the pack-opening backdrop — matches the active starfield tier. */
export function getStarFieldBackground(packPrice: number): string {
  return resolveTier(packPrice).background;
}

/** Pack price tier id — shared by StarField and opening UI. */
export function getPackPriceTier(packPrice: number): StarFieldTierId {
  return resolveTier(packPrice).id;
}

function buildStars(tier: TierConfig): StarDot[] {
  return Array.from({ length: tier.starCount }, (_, id) => ({
    id,
    left: randomBetween(0, 100),
    top: randomBetween(0, 100),
    size: randomBetween(1, 3),
    color: pickRandom(tier.starColors),
    opacity: randomBetween(0.35, 1),
    duration: randomBetween(tier.twinkleDurationMin, tier.twinkleDurationMax),
    delay: randomBetween(0, tier.twinkleDelayMax),
  }));
}

function shootingStarGradient(color: string, peakOpacity: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${peakOpacity * 0.35}) 35%, rgba(255,255,255,${peakOpacity}) 100%)`;
  }
  const { r, g, b } = rgb;
  return `linear-gradient(90deg, transparent 0%, rgba(${r}, ${g}, ${b}, ${peakOpacity * 0.35}) 35%, rgba(${r}, ${g}, ${b}, ${peakOpacity}) 100%)`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return null;
  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value)) return null;
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

const STARFIELD_STYLES = `
  @keyframes starfield-twinkle {
    0%, 100% { opacity: var(--twinkle-min); transform: scale(1); }
    50% { opacity: var(--twinkle-max); transform: scale(1.15); }
  }

  @keyframes starfield-shoot {
    0% {
      transform: translate(0, 0) rotate(35deg);
      opacity: var(--shoot-peak-opacity);
    }
    100% {
      transform: translate(120vw, 60vh) rotate(35deg);
      opacity: 0;
    }
  }

  @keyframes starfield-glow-pulse {
    0%, 100% { opacity: 0.28; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.06); }
  }
`;

export default function StarField({ packPrice, className = "" }: StarFieldProps) {
  const tier = useMemo(() => resolveTier(packPrice), [packPrice]);
  const stars = useMemo(() => buildStars(tier), [tier]);
  const [shootingStars, setShootingStars] = useState<ActiveShootingStar[]>([]);

  useEffect(() => {
    let cancelled = false;
    const timeoutIds: number[] = [];

    const scheduleShootingStar = (slot: number) => {
      if (cancelled) return;

      const delayMs = randomBetween(tier.shootDelayMinMs, tier.shootDelayMaxMs);
      const timeoutId = window.setTimeout(() => {
        if (cancelled) return;

        setShootingStars((prev) => [
          ...prev,
          {
            key: Date.now() + slot + Math.random(),
            top: randomBetween(0, 30),
            left: randomBetween(0, 60),
            duration: randomBetween(0.7, 1.4),
            color: pickRandom(tier.starColors),
            peakOpacity: tier.shootingStarPeakOpacity,
          },
        ]);

        scheduleShootingStar(slot);
      }, delayMs);

      timeoutIds.push(timeoutId);
    };

    setShootingStars([]);

    for (let slot = 0; slot < SHOOTING_STAR_SLOTS; slot += 1) {
      scheduleShootingStar(slot);
    }

    return () => {
      cancelled = true;
      timeoutIds.forEach((id) => window.clearTimeout(id));
    };
  }, [
    tier.id,
    tier.shootDelayMinMs,
    tier.shootDelayMaxMs,
    tier.shootingStarPeakOpacity,
    tier.starColors,
  ]);

  const removeShootingStar = (key: number) => {
    setShootingStars((prev) => prev.filter((star) => star.key !== key));
  };

  return (
    <>
      <style>{STARFIELD_STYLES}</style>
      <div
        className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`.trim()}
        style={{ background: tier.background }}
        aria-hidden
      >
        {tier.showGlowPulse ? (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "88%",
              height: "72%",
              background: tier.glowGradient,
              animation: "starfield-glow-pulse 4.5s ease-in-out infinite",
            }}
          />
        ) : null}

        {stars.map((star) => (
          <div
            key={star.id}
            style={
              {
                position: "absolute",
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                borderRadius: "50%",
                background: star.color,
                "--twinkle-min": String(star.opacity * 0.25),
                "--twinkle-max": String(star.opacity),
                animation: `starfield-twinkle ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`,
              } as CSSProperties
            }
          />
        ))}

        {shootingStars.map((star) => (
          <div
            key={star.key}
            onAnimationEnd={() => removeShootingStar(star.key)}
            style={
              {
                position: "absolute",
                top: `${star.top}%`,
                left: `${star.left}%`,
                width: "120px",
                height: "1px",
                background: shootingStarGradient(star.color, star.peakOpacity),
                transformOrigin: "left center",
                "--shoot-peak-opacity": String(star.peakOpacity),
                animation: `starfield-shoot ${star.duration}s ease-out forwards`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}
