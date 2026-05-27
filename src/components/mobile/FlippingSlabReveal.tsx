import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Card } from "../../types";
import type { StoreRarity } from "../../types/store";
import { resolveAssetUrl, isRenderableAssetUrl } from "../../utils/resolveAssetUrl";
import { CARD_PLACEHOLDER_IMAGE } from "../../constants/cardAssets";
import { useFallbackImageSrc, IMAGE_PLACEHOLDER } from "../../hooks/useFallbackImageSrc";
import { getStoreRevealIntensity, getStoreRevealGlowGradient } from "../../utils/revealGlow";
import { GlassSurface } from "./GlassSurface";
import { ObsidianImage } from "./ObsidianImage";

interface FlippingSlabRevealProps {
  card: Card;
  playFlip?: boolean;
  onFlipComplete?: () => void;
  immersive?: boolean;
  /** Drives legendary/epic/rare glow during flip. */
  revealRarity?: string;
  /** 5-tier store rarity — scales flip spring and slab glow intensity. */
  storeRarity?: StoreRarity;
}

export function FlippingSlabReveal({
  card,
  playFlip = true,
  onFlipComplete,
  immersive = true,
  storeRarity,
}: FlippingSlabRevealProps) {
  const [sheenDone, setSheenDone] = useState(false);

  const resolvedSrc = useMemo(() => {
    const trimmed = card.image?.trim() ?? "";
    const candidate = isRenderableAssetUrl(trimmed) ? trimmed : CARD_PLACEHOLDER_IMAGE;
    return resolveAssetUrl(candidate);
  }, [card.image]);

  const { imgSrc, onError } = useFallbackImageSrc(resolvedSrc, IMAGE_PLACEHOLDER);
  const intensity = useMemo(() => getStoreRevealIntensity(storeRarity), [storeRarity]);
  const flipSpring = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: intensity.flipStiffness,
      damping: intensity.flipDamping,
    }),
    [intensity.flipDamping, intensity.flipStiffness],
  );
  const glowStyle = useMemo(
    () => ({ background: getStoreRevealGlowGradient(storeRarity) }),
    [storeRarity],
  );
  const slabGlowOpacity = playFlip ? intensity.glowOpacityPeak : intensity.glowOpacityPeak * 0.35;
  const slabGlowScale = playFlip ? intensity.glowScalePeak * 0.6 : 1;

  useEffect(() => {
    setSheenDone(false);
  }, [resolvedSrc]);

  useEffect(() => {
    if (!playFlip) {
      setSheenDone(true);
      onFlipComplete?.();
    }
  }, [playFlip, onFlipComplete]);

  const sizeClass = immersive
    ? "h-[min(80dvh,680px)] w-[min(96vw,440px)]"
    : "h-[min(72dvh,560px)] w-[min(94vw,400px)]";

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <motion.div
        className="pointer-events-none absolute inset-0 scale-125"
        style={glowStyle}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{
          opacity: slabGlowOpacity,
          scale: slabGlowScale,
        }}
        transition={{ duration: playFlip ? 0.85 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />
      <div className={`relative ${sizeClass}`} style={{ perspective: 1800 }}>
        <motion.div
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
          initial={playFlip ? { rotateY: 180, scale: 0.6 } : { rotateY: 0, scale: 1 }}
          animate={{ rotateY: 0, scale: 1 }}
          transition={playFlip ? flipSpring : { duration: 0 }}
          onAnimationComplete={() => {
            if (!sheenDone) setSheenDone(true);
            if (playFlip) onFlipComplete?.();
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <GlassSurface variant="default" className="h-20 w-20 rounded-3xl" />
          </div>

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <ObsidianImage
              imgSrc={imgSrc}
              fallbackSrc={IMAGE_PLACEHOLDER}
              alt={card.name}
              onError={onError}
              priority
              imgClassName="h-full w-full object-contain object-center"
            />
            {sheenDone ? (
              <motion.div
                className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"
                initial={{ x: "-140%", skewX: -14 }}
                animate={{ x: "140%" }}
                transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden
              />
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
