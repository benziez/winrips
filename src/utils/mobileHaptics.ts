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
