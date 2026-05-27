import { useCallback, useEffect, useRef } from "react";
import { unlockSoundManager } from "../lib/SoundManager";

const TENSION_SRC = "/sounds/tension.mp3";
const TENSION_FALLBACK_SRC = "/sounds/spin_loop.mp3";
const BURST_SRC = "/sounds/reveal_chime.mp3";
const TENSION_FADE_MS = 2_000;

function createTensionElement(): HTMLAudioElement {
  const audio = new Audio(TENSION_SRC);
  audio.loop = true;
  audio.preload = "auto";
  return audio;
}

/**
 * Triumph-style tension bed: fade in at 3s mark, hard cut + burst at tear/reveal.
 * Uses HTML Audio (Capacitor webview) — not expo-av.
 */
export function usePackAudio() {
  const tensionRef = useRef<HTMLAudioElement | null>(null);
  const burstRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);

  const ensureTension = useCallback(async (): Promise<HTMLAudioElement> => {
    if (tensionRef.current) return tensionRef.current;

    const primary = createTensionElement();
    await new Promise<void>((resolve) => {
      primary.addEventListener("canplaythrough", () => resolve(), { once: true });
      primary.addEventListener("error", () => resolve(), { once: true });
      primary.load();
    });

    if (primary.error) {
      const fallback = new Audio(TENSION_FALLBACK_SRC);
      fallback.loop = true;
      fallback.preload = "auto";
      tensionRef.current = fallback;
      return fallback;
    }

    tensionRef.current = primary;
    return primary;
  }, []);

  const preload = useCallback(() => {
    unlockSoundManager();
    void ensureTension();
    if (!burstRef.current) {
      const burst = new Audio(BURST_SRC);
      burst.preload = "auto";
      burstRef.current = burst;
    }
  }, [ensureTension]);

  const startTensionFade = useCallback(async () => {
    const tension = await ensureTension();
    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }

    tension.volume = 0;
    tension.currentTime = 0;
    void tension.play().catch(() => {});

    const startedAt = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startedAt;
      tension.volume = Math.min(1, elapsed / TENSION_FADE_MS);
      if (elapsed < TENSION_FADE_MS) {
        fadeFrameRef.current = requestAnimationFrame(tick);
      } else {
        fadeFrameRef.current = null;
      }
    };
    fadeFrameRef.current = requestAnimationFrame(tick);
  }, [ensureTension]);

  const stopTensionAndBurst = useCallback(() => {
    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
    if (tensionRef.current) {
      tensionRef.current.pause();
      tensionRef.current.currentTime = 0;
      tensionRef.current.volume = 0;
    }
    if (!burstRef.current) {
      burstRef.current = new Audio(BURST_SRC);
    }
    const burst = burstRef.current;
    burst.currentTime = 0;
    void burst.play().catch(() => {});
  }, []);

  const stopAll = useCallback(() => {
    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
    if (tensionRef.current) {
      tensionRef.current.pause();
      tensionRef.current.currentTime = 0;
      tensionRef.current.volume = 0;
    }
    if (burstRef.current) {
      burstRef.current.pause();
      burstRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  return { preload, startTensionFade, stopTensionAndBurst, stopAll };
}
