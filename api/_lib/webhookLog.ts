/** Structured logs for NOWPayments IPN — visible in Vercel → Functions → Logs. */
export function logWebhook(
  event: string,
  fields: Record<string, unknown> = {},
): void {
  console.log(
    JSON.stringify({
      tag: "nowpayments_ipn",
      event,
      at: new Date().toISOString(),
      ...fields,
    }),
  );
}
