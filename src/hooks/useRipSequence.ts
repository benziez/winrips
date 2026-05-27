import { useCallback, useRef } from "react";

export type RipSubPhase = "shake" | "tear" | "transition";

const SHAKE_MS = 3_000;
const TEAR_MS = 4_000;
const TRANSITION_MS = 1_000;

export const RIP_SEQUENCE_TOTAL_MS = SHAKE_MS + TEAR_MS + TRANSITION_MS;

interface UseRipSequenceOptions {
  onSubPhase: (phase: RipSubPhase) => void;
  onTensionStart: () => void;
  onRevealTransition: () => void;
  onComplete: () => void;
}

/** Deterministic 8s auto-rip timeline: 0–3s shake, 3–7s tear, 7–8s transition. */
export function useRipSequence({
  onSubPhase,
  onTensionStart,
  onRevealTransition,
  onComplete,
}: UseRipSequenceOptions) {
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delayMs: number) => {
    const id = window.setTimeout(fn, delayMs);
    timersRef.current.push(id);
  }, []);

  const start = useCallback(() => {
    clearTimers();
    onSubPhase("shake");

    schedule(() => {
      onSubPhase("tear");
      onTensionStart();
    }, SHAKE_MS);

    schedule(() => {
      onSubPhase("transition");
      onRevealTransition();
    }, SHAKE_MS + TEAR_MS);

    schedule(onComplete, RIP_SEQUENCE_TOTAL_MS);
  }, [clearTimers, onComplete, onRevealTransition, onSubPhase, onTensionStart, schedule]);

  const cancel = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  return { start, cancel };
}
