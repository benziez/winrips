import { InAppReview as RateApp } from "@capacitor-community/in-app-review";
import { isNativeCapacitorApp } from "../utils/platform";
import { logger } from "./logger";

/** Native in-app review prompt (StoreKit on iOS). No-op on web. */
export async function requestAppReview(): Promise<void> {
  if (!isNativeCapacitorApp()) return;

  try {
    await RateApp.requestReview();
  } catch (error) {
    logger.warn("[requestAppReview] failed:", error);
  }
}
