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
import { handleStripeHttp } from "./stripeRoutes.js";

/** Dispatches payment, balance, vault, and fairness API routes. */
export async function handlePaymentHttp(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (await handleStripeHttp(req, res)) return true;
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
