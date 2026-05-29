import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";

/** Hide the iOS WKWebView input accessory bar (up/down/checkmark toolbar). */
export async function configureNativeKeyboard(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Keyboard.setAccessoryBarVisible({ isVisible: false });
  } catch {
    // Keyboard plugin unavailable — non-fatal on web/other platforms.
  }
}
