import type { IncomingMessage, ServerResponse } from "node:http";
import {
  handleStripeCreatePaymentIntentRoute,
  handleStripePaymentIntentStatusRoute,
  handleStripeWebhookRoute,
} from "./stripeDeposit.js";
import { handleStripeKycSessionRoute } from "./stripeKyc.js";
import {
  handleStripeConnectStatusRoute,
  handleStripeCreateConnectAccountRoute,
  handleStripeCreateOnboardingLinkRoute,
  handleStripeWithdrawRoute,
} from "./stripeConnect.js";

/** Dispatches all /api/stripe/* routes from a single Vercel serverless function. */
export async function handleStripeHttp(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (await handleStripeCreatePaymentIntentRoute(req, res)) return true;
  if (await handleStripePaymentIntentStatusRoute(req, res)) return true;
  if (await handleStripeWebhookRoute(req, res)) return true;
  if (await handleStripeConnectStatusRoute(req, res)) return true;
  if (await handleStripeKycSessionRoute(req, res)) return true;
  if (await handleStripeCreateConnectAccountRoute(req, res)) return true;
  if (await handleStripeCreateOnboardingLinkRoute(req, res)) return true;
  if (await handleStripeWithdrawRoute(req, res)) return true;
  return false;
}
