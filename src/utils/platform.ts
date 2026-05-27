import { Capacitor } from "@capacitor/core";

/** True when running inside a Capacitor native shell (iOS or Android). */
export function isNativeCapacitorApp(): boolean {
  return Capacitor.getPlatform() !== "web";
}

export function getCapacitorPlatform(): "web" | "ios" | "android" {
  const platform = Capacitor.getPlatform();
  if (platform === "ios" || platform === "android") return platform;
  return "web";
}
