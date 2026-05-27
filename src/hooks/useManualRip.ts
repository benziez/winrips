import { useCallback, useRef, useState } from "react";

interface UseManualRipOptions {
  /** Drag distance (px) mapped to 100% tear. */
  thresholdPx?: number;
  /** Auto-burst when progress crosses this value (0–1). */
  burstAt?: number;
  onBurst: () => void;
  onProgress?: (progress: number) => void;
}

/**
 * Pan-down gesture maps translationY → tear progress (Capacitor webview pointer events).
 */
export function useManualRip({
  thresholdPx = 220,
  burstAt = 0.8,
  onBurst,
  onProgress,
}: UseManualRipOptions) {
  const [progress, setProgress] = useState(0);
  const draggingRef = useRef(false);
  const originYRef = useRef(0);
  const burstFiredRef = useRef(false);
  const onBurstRef = useRef(onBurst);
  const onProgressRef = useRef(onProgress);

  onBurstRef.current = onBurst;
  onProgressRef.current = onProgress;

  const reset = useCallback(() => {
    setProgress(0);
    draggingRef.current = false;
    burstFiredRef.current = false;
  }, []);

  const updateFromClientY = useCallback(
    (clientY: number) => {
      const dy = Math.max(0, clientY - originYRef.current);
      const next = Math.min(1, dy / thresholdPx);
      setProgress(next);
      onProgressRef.current?.(next);

      if (!burstFiredRef.current && next >= burstAt) {
        burstFiredRef.current = true;
        onBurstRef.current();
      }
    },
    [thresholdPx, burstAt],
  );

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    burstFiredRef.current = false;
    originYRef.current = event.clientY;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updateFromClientY(event.clientY);
    },
    [updateFromClientY],
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const onPointerCancel = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return {
    progress,
    reset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
