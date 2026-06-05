import { Stripe } from "@capacitor-community/stripe";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

if (!publishableKey?.trim()) {
  console.warn(
    "[Stripe] VITE_STRIPE_PUBLISHABLE_KEY is not set — native PaymentSheet will not work in this build.",
  );
}

let initialized = false;
let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

function stripeKeyMode(key: string): "test" | "live" | "unknown" {
  if (key.startsWith("pk_test_")) return "test";
  if (key.startsWith("pk_live_")) return "live";
  return "unknown";
}

/** Safe summary for logs (never log full publishable key). */
export function getStripeKeyDiagnostics(): {
  configured: boolean;
  initialized: boolean;
  /** First 8 chars, e.g. pk_live_ or pk_test_ */
  keyPrefix: string | null;
  keyMode: "test" | "live" | "unknown" | "missing";
  keySuffix: string | null;
  initError: string | null;
} {
  const trimmed = publishableKey?.trim() ?? "";
  return {
    configured: Boolean(trimmed),
    initialized,
    keyPrefix: trimmed.length >= 8 ? trimmed.slice(0, 8) : trimmed || null,
    keyMode: trimmed ? stripeKeyMode(trimmed) : "missing",
    keySuffix: trimmed.length >= 8 ? trimmed.slice(-8) : trimmed || null,
    initError: initError?.message ?? null,
  };
}

/**
 * Call before any PaymentSheet / Apple Pay API usage.
 * Idempotent; safe to await on every deposit attempt.
 */
export async function ensureStripeInitialized(): Promise<void> {
  if (initialized) return;
  if (initPromise) {
    await initPromise;
    if (initError) throw initError;
    return;
  }

  initPromise = (async () => {
    const key = publishableKey?.trim();
    if (!key) {
      throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is not set.");
    }

    try {
      await Stripe.initialize({ publishableKey: key });
      initialized = true;
      const mode = stripeKeyMode(key);
      console.info("[Stripe] initialize OK", {
        keyPrefix: key.slice(0, 8),
        keyMode: mode,
        keySuffix: key.slice(-8),
      });
      if (mode === "unknown") {
        console.warn(
          "[Stripe] Publishable key should start with pk_test_ or pk_live_. Wrong key format often causes paymentSheetFailed.",
        );
      }
    } catch (error) {
      initError = error instanceof Error ? error : new Error(String(error));
      console.error("[Stripe] initialize failed:", initError.message);
      throw initError;
    }
  })();

  await initPromise;
}

/** Fire-and-forget at app boot; deposits should still call ensureStripeInitialized(). */
export async function initializeStripe(): Promise<void> {
  try {
    await ensureStripeInitialized();
  } catch {
    // Logged in ensureStripeInitialized; boot should not crash the app.
  }
}

export function isStripeConfigured(): boolean {
  return Boolean(publishableKey?.trim());
}

export { Stripe };
