import { createPaymentsServer } from "./paymentHttp.mjs";

const port = Number(process.env.PAYMENTS_PORT ?? 8787);
const server = createPaymentsServer();

server.listen(port, () => {
  console.log(`WinRips payments API on http://localhost:${port}`);
  console.log("  POST /api/payments/create");
  console.log("  POST /api/payments/webhook  (NOWPayments IPN)");
  console.log("  GET  /api/account/balance?userId=...");
});
