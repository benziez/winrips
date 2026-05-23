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

interface UnboxingCarouselProps {
  cards: Card[];
  isSpinning: boolean;
  winnerIndex?: number;
  cardWidth?: number;
}

export function UnboxingCarousel({
  cards,
  isSpinning,
  winnerIndex = ROULETTE_WINNER_INDEX,
  cardWidth = ROULETTE_CARD_WIDTH,
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
  }, [isSpinning, cards.length, winnerIndex, cardWidth]);

  const showWinnerHighlight = !isSpinning && cards.length > 0;
  const isCompactPreview = cards.length <= 5;

  return (
    <div
      className={`relative w-full max-w-full ${
        isCompactPreview ? "min-h-[200px]" : "min-h-[220px] sm:min-h-[300px]"
      }`}
    >
      <div className="spin-center-line pointer-events-none absolute bottom-0 left-1/2 top-0 z-20 -translate-x-1/2" />

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
          className={`flex gap-3 py-5 will-change-transform ${isSpinning && isAnimating ? "blur-[1px] opacity-95" : ""} ${
            isCompactPreview ? "mx-auto" : ""
          }`}
          style={{
            transform: `translateX(-${translateX}px)`,
            transition: isAnimating
              ? `transform ${ROULETTE_SPIN_MS}ms var(--ease-spin-heavy, cubic-bezier(0.08, 0.82, 0.17, 1))`
              : "none",
          }}
        >
          {cards.map((card, index) => (
            <CarouselCard
              key={`slot-${index}-${card.id}`}
              card={card}
              width={cardWidth}
              highlighted={showWinnerHighlight && index === winnerIndex}
              dimmed={showWinnerHighlight && index !== winnerIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
