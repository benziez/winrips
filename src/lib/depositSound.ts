/** Web Audio coin chime — no external asset required. Failures are non-blocking. */

import { logger } from "./logger";

const AUTOPLAY_BLOCKED_MESSAGE = "Audio autoplay blocked until user interaction";

let audioContext: AudioContext | null = null;
let unlocked = false;

function warnDepositSound(message: string, error?: unknown): void {
  const detail = error instanceof Error ? error.message : error != null ? String(error) : "";
  logger.warn(
    `[depositSound] ${message}${detail ? ` (${detail})` : ""}`,
  );
}

function warnAutoplayBlocked(error?: unknown): void {
  logger.warn(AUTOPLAY_BLOCKED_MESSAGE, error ?? "");
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (audioContext) return audioContext;

  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      warnDepositSound("Web Audio API is not available in this browser.");
      return null;
    }
    audioContext = new Ctx();
    return audioContext;
  } catch (error) {
    warnDepositSound("AudioContext initialization was blocked.", error);
    audioContext = null;
    return null;
  }
}

/** Call after a user gesture (or on mount) so playback is not blocked. Never throws. */
export async function preloadDepositSound(): Promise<void> {
  try {
    const ctx = getContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
        unlocked = true;
      } catch (error) {
        warnAutoplayBlocked(error);
      }
    } else {
      unlocked = true;
    }
  } catch (error) {
    warnDepositSound("preloadDepositSound failed.", error);
  }
}

/** Plays the deposit chime. Never throws — safe to call from balance sync / toasts. */
export function playDepositSound(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;

    void playDepositSoundAsync(ctx).catch((error) => {
      warnAutoplayBlocked(error);
    });
  } catch (error) {
    warnDepositSound("playDepositSound failed.", error);
  }
}

async function playDepositSoundAsync(ctx: AudioContext): Promise<void> {
  try {
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (error) {
        warnAutoplayBlocked(error);
        return;
      }
    }

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    try {
      master.connect(ctx.destination);
    } catch (error) {
      warnDepositSound("Could not connect deposit chime to audio output.", error);
      return;
    }

    const playTone = (frequency: number, start: number, duration: number) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.9, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(master);
        osc.start(start);
        osc.stop(start + duration + 0.05);
      } catch (error) {
        warnDepositSound(`Tone at ${frequency}Hz could not play.`, error);
      }
    };

    playTone(880, now + 0.02, 0.12);
    playTone(1174.66, now + 0.1, 0.18);
    playTone(1567.98, now + 0.2, 0.22);
    unlocked = true;
  } catch (error) {
    warnDepositSound("Deposit chime scheduling failed.", error);
  }
}

export function isDepositSoundReady(): boolean {
  try {
    return unlocked && audioContext?.state === "running";
  } catch {
    return false;
  }
}
