import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handlePaymentHttp } from "../api/_lib/paymentRoutes.js";

function runPaymentHttp(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void {
  void handlePaymentHttp(req, res).then((handled) => {
    if (!handled) next();
  });
}

/** Attaches payment + IPN webhook routes during Vite dev (keeps API keys server-side). */
export function paymentsDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: "winrips-payments-api",
    configureServer(server) {
      for (const [key, value] of Object.entries(env)) {
        if (key.startsWith("NOWPAYMENTS_")) {
          process.env[key] = value;
        }
      }

      server.middlewares.use(runPaymentHttp);
    },
  };
}
