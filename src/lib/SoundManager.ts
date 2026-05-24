import { logger } from "./logger";

const SPIN_LOOP_SRC = "/sounds/spin_loop.mp3";
const REVEAL_CHIME_SRC = "/sounds/reveal_chime.mp3";

let spinSound: HTMLAudioElement | null = null;
let revealSound: HTMLAudioElement | null = null;
let userHasInteracted = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getSpinSound(): HTMLAudioElement | null {
  if (!isBrowser()) return null;
  if (!spinSound) {
    spinSound = new Audio(SPIN_LOOP_SRC);
    spinSound.loop = true;
    spinSound.preload = "auto";
  }
  return spinSound;
}

function getRevealSound(): HTMLAudioElement | null {
  if (!isBrowser()) return null;
  if (!revealSound) {
    revealSound = new Audio(REVEAL_CHIME_SRC);
    revealSound.preload = "auto";
  }
  return revealSound;
}

/** Call once after a user gesture so autoplay policies allow playback. */
export function unlockSoundManager(): void {
  if (!isBrowser()) return;
  userHasInteracted = true;

  const spin = getSpinSound();
  const reveal = getRevealSound();

  if (spin) {
    spin.load();
  }
  if (reveal) {
    reveal.load();
  }
}

export function isSoundManagerUnlocked(): boolean {
  return userHasInteracted;
}

function canPlay(): boolean {
  if (!userHasInteracted) {
    logger.warn("[SoundManager] Skipping playback — waiting for user interaction.");
    return false;
  }
  return true;
}

/** Start the looping spin bed (requires prior user interaction). */
export function playSpin(): void {
  if (!canPlay()) return;

  const spin = getSpinSound();
  if (!spin) return;

  spin.currentTime = 0;
  spin.playbackRate = 1.5;
  void spin.play().catch((error) => {
    logger.warn("[SoundManager] playSpin blocked:", error);
  });
}

/**
 * Adjust spin loop playback rate by carousel progress (0 = start, 1 = end).
 * Rate eases from 1.5 down toward 0.5, clamped at 0.4 minimum.
 */
export function updateSpinSpeed(progress: number): void {
  const spin = getSpinSound();
  if (!spin) return;

  const clamped = Math.min(1, Math.max(0, progress));
  const rate = 1.5 - clamped * 1.0;
  spin.playbackRate = Math.max(0.4, rate);
}

/** Stop the spin loop without playing the reveal chime. */
export function stopSpin(): void {
  const spin = getSpinSound();
  if (!spin) return;
  spin.pause();
  spin.currentTime = 0;
  spin.playbackRate = 1;
}

/** Stop the spin loop and play the reveal chime immediately. */
export function stopSpinAndPlayReveal(): void {
  if (!canPlay()) return;

  const spin = getSpinSound();
  const reveal = getRevealSound();

  if (spin) {
    spin.pause();
    spin.currentTime = 0;
  }

  if (reveal) {
    reveal.currentTime = 0;
    void reveal.play().catch((error) => {
      logger.warn("[SoundManager] reveal chime blocked:", error);
    });
  }
}

/** Stop all pack-opening sounds (e.g. on unmount or navigation). */
export function stopAllSounds(): void {
  if (spinSound) {
    spinSound.pause();
    spinSound.currentTime = 0;
    spinSound.playbackRate = 1;
  }
  if (revealSound) {
    revealSound.pause();
    revealSound.currentTime = 0;
  }
}

/** @deprecated Use named exports — kept for object-style access. */
export const SoundManager = {
  unlock: unlockSoundManager,
  playSpin,
  updateSpinSpeed,
  stopSpin,
  stopSpinAndPlayReveal,
  stopAll: stopAllSounds,
  isUnlocked: isSoundManagerUnlocked,
};
