import { memo } from "react";
import type { Rarity } from "../../types";
import { formatUsd, gemsToUsd } from "../../constants/retail";
import { CollectibleImage } from "../ui/CollectibleImage";
import { resolveCollectibleImageSrc } from "../../utils/collectibleImageSrc";
import { glowPaletteForCardRarity } from "../../utils/rarityGlowColors";
import { formatPullTimeAgo } from "../../utils/pullTimeAgo";

export interface JustPulledFeedTile {
  key: string;
  name: string;
  value: number;
  image: string;
  rarity: Rarity;
  acquiredAt: string;
}

interface JustPulledFeedCardProps {
  tile: JustPulledFeedTile;
  nowMs: number;
  index?: number;
  totalTiles?: number;
  className?: string;
  onClick?: () => void;
}

export const JustPulledFeedCard = memo(function JustPulledFeedCard({
  tile,
  nowMs,
  className = "",
  onClick,
}: JustPulledFeedCardProps) {
  const cardBody = (
    <div
      className="flex aspect-[2/3.35] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
      style={{ boxShadow: "var(--rip-shadow-pack)" }}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0a0a0a]">
        <CollectibleImage
          src={resolveCollectibleImageSrc(tile.image, { thumbnail: false })}
          alt={tile.name}
          className="h-full w-full object-contain p-1"
          optimize={false}
          thumbnail={false}
          priority
          loading="eager"
          fetchPriority="high"
          width={160}
          height={268}
          aspectRatio="2 / 3.35"
          placeholderTintRgb={glowPaletteForCardRarity(tile.rarity).rgb}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-b from-transparent to-[#111]"
          aria-hidden
        />
      </div>
      <div className="flex min-h-[80px] shrink-0 flex-col justify-center gap-0.5 overflow-visible px-2.5 py-2.5">
        <p className="truncate text-[14px] font-bold leading-tight text-white">{tile.name}</p>
        <p className="shrink-0 whitespace-nowrap text-[12px] font-bold tabular-nums leading-none text-[var(--rip-green-bright)]">
          {formatUsd(gemsToUsd(tile.value))}
        </p>
        <p className="shrink-0 text-[11px] leading-tight text-[var(--rip-text-muted)]">
          {formatPullTimeAgo(tile.acquiredAt, nowMs)}
        </p>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`View ${tile.name} pull details`}
        className={`w-full shrink-0 snap-start text-left${className}`}
      >
        {cardBody}
      </button>
    );
  }

  return (
    <div className={`w-full shrink-0 snap-start${className}`} aria-hidden={false}>
      {cardBody}
    </div>
  );
});
