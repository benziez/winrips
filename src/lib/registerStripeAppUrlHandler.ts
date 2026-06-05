import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { ensureStripeInitialized, Stripe } from "./stripeClient";
import { STRIPE_IOS_RETURN_URL } from "./stripePaymentSheet";

const STRIPE_RETURN_SCHEME = "com.winrips.app://";

let registered = false;

function isStripeReturnUrl(url: string): boolean {
  return url.startsWith(STRIPE_RETURN_SCHEME);
}

/**
 * Forwards Stripe PaymentSheet 3DS / redirect URLs to the native SDK.
 * Call once after Stripe.initialize() at app boot (see main.tsx).
 */
export async function registerStripeAppUrlHandler(): Promise<void> {
  if (registered) return;

  const platform = Capacitor.getPlatform();
  if (platform !== "ios" && platform !== "android") {
    return;
  }

  if (!Stripe.handleURLCallback) {
    console.warn("[Stripe] handleURLCallback is not available on this platform.");
    return;
  }

  await ensureStripeInitialized();

  const launch = await App.getLaunchUrl();
  if (launch?.url && isStripeReturnUrl(launch.url)) {
    try {
      await Stripe.handleURLCallback({ url: launch.url });
      console.info("[Stripe] handleURLCallback (cold start)", launch.url);
    } catch (error) {
      console.warn("[Stripe] handleURLCallback (cold start) failed:", launch.url, error);
    }
  }

  await App.addListener("appUrlOpen", async (event) => {
    const url = event.url?.trim() ?? "";
    if (!isStripeReturnUrl(url)) return;

    try {
      await Stripe.handleURLCallback!({ url });
      console.info("[Stripe] handleURLCallback (appUrlOpen)", url);
    } catch (error) {
      console.warn("[Stripe] handleURLCallback (appUrlOpen) failed:", url, error);
    }
  });

  registered = true;
  console.info("[Stripe] appUrlOpen handler registered for", STRIPE_IOS_RETURN_URL);
}
