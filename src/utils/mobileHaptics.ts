import { Capacitor } from "@capacitor/core";

/** Light tap feedback for tab bar and primary mobile actions. */
export async function hapticTabSelect(): Promise<void> {
  if (Capacitor.getPlatform() === "web") return;

  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* Haptics unavailable */
  }
}

/** Medium impact for primary CTAs (buy, confirm). */
export async function hapticMediumImpact(): Promise<void> {
  if (Capacitor.getPlatform() === "web") return;

  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* Haptics unavailable */
  }
}

/** Light impact for spinner needle ticks (mobile roulette). */
export async function hapticSpinnerTick(): Promise<void> {
  if (Capacitor.getPlatform() === "web") return;

  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
    if (import.meta.env.DEV) {
      console.log("[SpinnerHaptic] tick");
    }
  } catch {
    /* Haptics unavailable */
  }
}

/** Success notification for completed flows (shipping, exchange). */
export async function hapticNotificationSuccess(): Promise<void> {
  if (Capacitor.getPlatform() === "web") return;

  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* Haptics unavailable */
  }
}

/** Heavy impact for pack rip moments. */
export async function hapticHeavyImpact(): Promise<void> {
  if (Capacitor.getPlatform() === "web") return;

  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    /* Haptics unavailable */
  }
}

/** Repeated heavy impacts while the pack is ripping. Returns a stop function. */
export function startRipHapticBurst(intervalMs = 120): () => void {
  if (Capacitor.getPlatform() === "web") {
    return () => {};
  }

  let active = true;
  void hapticHeavyImpact();

  const id = window.setInterval(() => {
    if (!active) return;
    void hapticHeavyImpact();
  }, intervalMs);

  return () => {
    active = false;
    window.clearInterval(id);
  };
}
