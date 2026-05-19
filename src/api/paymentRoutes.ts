import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAccountBalanceRoute } from "./accountBalance";
import { handlePaymentsRoute } from "./payments";
import { handlePaymentsWebhookRoute } from "./paymentsWebhook";

/** Dispatches all payment + account balance API routes (Vite dev middleware). */
export async function handlePaymentHttp(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (await handlePaymentsWebhookRoute(req, res)) return true;
  if (await handleAccountBalanceRoute(req, res)) return true;
  if (await handlePaymentsRoute(req, res)) return true;
  return false;
}
