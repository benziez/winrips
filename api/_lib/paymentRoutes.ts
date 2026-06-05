import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAccountBalanceRoute, handleDevSetBalanceRoute } from "./accountBalance.js";
import { handleAccountDeleteRoute } from "./accountDelete.js";
import { handlePaymentsRoute } from "./payments.js";
import { handlePaymentsWebhookRoute } from "./paymentsWebhook.js";
import {
  handleVaultInventoryGetRoute,
  handleVaultInventoryMutateRoute,
} from "./vaultInventory.js";
import { handleFairnessSessionRoute } from "./fairnessSessionHttp.js";
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

/** Dispatches payment, balance, vault, and fairness API routes. */
export async function handlePaymentHttp(
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
  if (await handleFairnessSessionRoute(req, res)) return true;
  if (await handlePaymentsWebhookRoute(req, res)) return true;
  if (await handleDevSetBalanceRoute(req, res)) return true;
  if (await handleAccountBalanceRoute(req, res)) return true;
  if (await handleAccountDeleteRoute(req, res)) return true;
  if (await handleVaultInventoryGetRoute(req, res)) return true;
  if (await handleVaultInventoryMutateRoute(req, res)) return true;
  if (await handlePaymentsRoute(req, res)) return true;
  return false;
}
