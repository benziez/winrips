import { useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { hapticHeavyImpact, startRipHapticBurst } from "../utils/mobileHaptics";

async function impact(style: "Light" | "Medium" | "Heavy"): Promise<void> {
  if (Capacitor.getPlatform() === "web") return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      Light: ImpactStyle.Light,
      Medium: ImpactStyle.Medium,
      Heavy: ImpactStyle.Heavy,
    } as const;
    await Haptics.impact({ style: map[style] });
  } catch {
    /* unavailable */
  }
}

/** Rhythmic shake pulses + drag-proportional tactile feedback. */
export function useHapticRip() {
  const stopBurstRef = useRef<(() => void) | null>(null);
  const lastDragPulseRef = useRef(0);

  const startShakePulses = useCallback(() => {
    stopBurstRef.current?.();
    stopBurstRef.current = startRipHapticBurst(110);
  }, []);

  const stop = useCallback(() => {
    stopBurstRef.current?.();
    stopBurstRef.current = null;
  }, []);

  const pulseForDrag = useCallback((progress: number) => {
    const now = Date.now();
    const intervalMs = Math.max(45, 220 - progress * 170);
    if (now - lastDragPulseRef.current < intervalMs) return;
    lastDragPulseRef.current = now;

    if (progress < 0.35) {
      void impact("Light");
    } else if (progress < 0.72) {
      void impact("Medium");
    } else {
      void impact("Heavy");
    }
  }, []);

  const burst = useCallback(() => {
    stop();
    void hapticHeavyImpact();
    void hapticHeavyImpact();
  }, [stop]);

  return { startShakePulses, pulseForDrag, burst, stop };
}
