/** Structured logs for NOWPayments IPN — visible in Vercel → Functions → Logs. */
import { logger } from "./logger.js";

export function logWebhook(
  event: string,
  fields: Record<string, unknown> = {},
): void {
  if (process.env.NODE_ENV === "production") {
    logger.critical(`[nowpayments_ipn] ${event}`);
    return;
  }

  logger.log(
    JSON.stringify({
      tag: "nowpayments_ipn",
      event,
      at: new Date().toISOString(),
      ...fields,
    }),
  );
}
