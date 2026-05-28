import { Stripe } from "@capacitor-community/stripe";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

if (!publishableKey) {
  console.warn("VITE_STRIPE_PUBLISHABLE_KEY is not set — Stripe payments disabled.");
}

let initialized = false;

export async function initializeStripe(): Promise<void> {
  if (initialized) return;
  if (!publishableKey?.trim()) return;

  await Stripe.initialize({
    publishableKey: publishableKey.trim(),
  });

  initialized = true;
}

export function isStripeConfigured(): boolean {
  return Boolean(publishableKey?.trim());
}

export { Stripe };
