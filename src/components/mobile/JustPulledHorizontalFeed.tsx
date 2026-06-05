import { memo, useImperativeHandle, useRef, type RefObject } from "react";
import { JustPulledFeedCard, type JustPulledFeedTile } from "./JustPulledFeedCard";

export interface JustPulledFeedHandle {
  scrollByOneItem: () => void;
}

interface JustPulledHorizontalFeedProps<T extends JustPulledFeedTile = JustPulledFeedTile> {
  tiles: T[];
  nowMs: number;
  onTileClick?: (tile: T) => void;
  listRef?: RefObject<JustPulledFeedHandle | null>;
  paddingStart?: number;
  className?: string;
}

function scrollCarouselByOneItem(scroller: HTMLDivElement): void {
  const firstTile = scroller.querySelector<HTMLElement>("[data-just-pulled-tile]");
  const gap = 12;
  const tileWidth = firstTile?.offsetWidth ?? 0;
  const step =
    tileWidth > 0 ? tileWidth + gap : Math.round(scroller.clientWidth * 0.4) + gap;
  const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  scroller.scrollTo({
    left: Math.min(scroller.scrollLeft + step, maxScroll),
    behavior: "smooth",
  });
}

function JustPulledHorizontalFeedInner<T extends JustPulledFeedTile = JustPulledFeedTile>({
  tiles,
  nowMs,
  onTileClick,
  listRef,
  paddingStart = 16,
  className = "snap-x snap-mandatory scroll-pl-4 pr-6 pb-1",
}: JustPulledHorizontalFeedProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(listRef, () => ({
    scrollByOneItem() {
      const scroller = scrollerRef.current;
      if (scroller) scrollCarouselByOneItem(scroller);
    },
  }));

  return (
    <div
      ref={scrollerRef}
      className={`rip-hide-scrollbar flex transform-gpu flex-row gap-3 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch] ${className}`}
      style={{ paddingLeft: paddingStart > 0 ? paddingStart : undefined, paddingRight: 24 }}
    >
      {tiles.map((tile, index) => (
        <div
          key={tile.key}
          data-just-pulled-tile
          className={`w-[40vw] max-w-[168px] shrink-0 snap-start${index === 0 && paddingStart > 0 ? "" : ""}`}
        >
          <JustPulledFeedCard
            tile={tile}
            nowMs={nowMs}
            className="w-full max-w-none"
            onClick={
              onTileClick
                ? () => {
                    onTileClick(tile);
                  }
                : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}

export const JustPulledHorizontalFeed = memo(
  JustPulledHorizontalFeedInner,
) as typeof JustPulledHorizontalFeedInner;
