import { useEffect, useRef, useState } from "react";
import type { Card } from "../../types";
import {
  computeRouletteStopOffset,
  ROULETTE_CARD_GAP,
  ROULETTE_CARD_WIDTH,
  ROULETTE_SPIN_MS,
  ROULETTE_WINNER_INDEX,
} from "../../utils/rng";
import { CarouselCard } from "./CarouselCard";

/** Mobile spin: only render real art for tiles near the landing index; rest show card-backs. */
const ART_RENDER_WINDOW = 8;

interface UnboxingCarouselProps {
  cards: Card[];
  isSpinning: boolean;
  winnerIndex?: number;
  cardWidth?: number;
  /** Spin deceleration duration — defaults to ROULETTE_SPIN_MS (4000). */
  spinDurationMs?: number;
  /** Mobile: image-only tiles without price clutter. Web default unchanged. */
  compactCards?: boolean;
  /** When true, hide built-in slate edge fades (mobile wrapper provides its own). */
  suppressEdgeFades?: boolean;
}

export function UnboxingCarousel({
  cards,
  isSpinning,
  winnerIndex = ROULETTE_WINNER_INDEX,
  cardWidth = ROULETTE_CARD_WIDTH,
  spinDurationMs = ROULETTE_SPIN_MS,
  compactCards = false,
  suppressEdgeFades = false,
}: UnboxingCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const spinSessionRef = useRef(0);
  const cardsLengthRef = useRef(cards.length);
  cardsLengthRef.current = cards.length;

  useEffect(() => {
    const slotWidth = cardWidth + ROULETTE_CARD_GAP;

    if (cardsLengthRef.current === 0) {
      setTranslateX(0);
      setIsAnimating(false);
      return;
    }

    if (!isSpinning) {
      let frame = 0;
      const centerIdle = () => {
        const containerWidth = containerRef.current?.clientWidth ?? 0;
        if (containerWidth <= 0) {
          frame = requestAnimationFrame(centerIdle);
          return;
        }
        setIsAnimating(false);
        setTranslateX(computeRouletteStopOffset(winnerIndex, containerWidth, slotWidth));
      };
      centerIdle();
      return () => cancelAnimationFrame(frame);
    }

    const session = ++spinSessionRef.current;
    setIsAnimating(false);
    setTranslateX(0);

    let frame1 = 0;
    let frame2 = 0;

    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        if (spinSessionRef.current !== session) return;

        const containerWidth = containerRef.current?.clientWidth ?? 0;
        const stopOffset = computeRouletteStopOffset(winnerIndex, containerWidth, slotWidth);

        setIsAnimating(true);
        setTranslateX(stopOffset);
      });
    });

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [isSpinning, cards.length, winnerIndex, cardWidth, spinDurationMs]);

  const spinTransition = `transform ${spinDurationMs}ms var(--ease-spin-heavy, cubic-bezier(0.08, 0.82, 0.17, 1))`;

  const showWinnerHighlight = !isSpinning && cards.length > 0;
  const isCompactPreview = cards.length <= 5;
  const frameMinHeight = suppressEdgeFades ? "min-h-[340px]" : isCompactPreview ? "min-h-[220px]" : "min-h-[220px] sm:min-h-[300px]";

  return (
    <div
      className={`relative w-full max-w-full ${frameMinHeight}`}
    >
      <div className="spin-center-line pointer-events-none absolute bottom-0 left-1/2 top-0 z-20 -translate-x-1/2" />

      {!suppressEdgeFades ? (
        <>
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 bg-gradient-to-r from-slate to-transparent ${
              isCompactPreview ? "w-10" : "w-16 sm:w-28"
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-10 bg-gradient-to-l from-slate to-transparent ${
              isCompactPreview ? "w-10" : "w-16 sm:w-28"
            }`}
          />
        </>
      ) : null}

      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center overflow-hidden"
        style={{
          maskImage: isCompactPreview
            ? "linear-gradient(to right, transparent, black 6%, black 94%, transparent)"
            : "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage: isCompactPreview
            ? "linear-gradient(to right, transparent, black 6%, black 94%, transparent)"
            : "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div
          ref={trackRef}
          className={`flex gap-3 will-change-transform ${
            isCompactPreview ? "mx-auto py-6" : "py-5"
          } ${isSpinning && isAnimating ? "blur-[1px] opacity-95" : ""}`}
          style={{
            transform: `translateX(-${translateX}px)`,
            transition: isAnimating ? spinTransition : "none",
          }}
        >
          {cards.map((card, index) => {
            const renderArt =
              !compactCards || Math.abs(index - winnerIndex) <= ART_RENDER_WINDOW;
            return (
              <CarouselCard
                key={`slot-${index}-${card.id}`}
                card={card}
                width={cardWidth}
                highlighted={showWinnerHighlight && index === winnerIndex}
                dimmed={showWinnerHighlight && index !== winnerIndex}
                compact={compactCards}
                showArt={renderArt}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
