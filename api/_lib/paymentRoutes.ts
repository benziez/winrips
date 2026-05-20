import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAccountBalanceRoute, handleDevSetBalanceRoute } from "./accountBalance.js";
import { handlePaymentsRoute } from "./payments.js";
import { handlePaymentsWebhookRoute } from "./paymentsWebhook.js";

/** Dispatches all payment + account balance API routes. */
export async function handlePaymentHttp(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (await handlePaymentsWebhookRoute(req, res)) return true;
  if (await handleDevSetBalanceRoute(req, res)) return true;
  if (await handleAccountBalanceRoute(req, res)) return true;
  if (await handlePaymentsRoute(req, res)) return true;
  return false;
}
