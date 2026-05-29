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
      process.env.NODE_ENV ??= "development";

      for (const [key, value] of Object.entries(env)) {
        if (
          key.startsWith("NOWPAYMENTS_") ||
          key === "DEV_BALANCE_SECRET" ||
          key === "PORT" ||
          key === "VITE_PORT" ||
          key === "SUPABASE_URL" ||
          key === "SUPABASE_ANON_KEY" ||
          key === "SUPABASE_SERVICE_ROLE_KEY" ||
          key === "VITE_SUPABASE_URL" ||
          key === "VITE_SUPABASE_ANON_KEY" ||
          key === "STRIPE_SECRET_KEY" ||
          key === "STRIPE_WEBHOOK_SECRET" ||
          key === "STRIPE_IDENTITY_WEBHOOK_SECRET" ||
          key === "STRIPE_CONNECT_RETURN_BASE_URL"
        ) {
          process.env[key] = value;
        }
      }

      server.middlewares.use(runPaymentHttp);
    },
  };
}
