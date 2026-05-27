import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleApiCors } from "../_lib/cors.js";
import { dispatchPaymentRoute, readVercelRawBody } from "../_lib/vercelHttp.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.NOWPAYMENTS_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "[payments/create] NOWPAYMENTS_API_KEY is undefined — set it in Vercel project settings or local .env.",
    );
    res.status(503).json({
      error: "Payment provider is not configured (missing NOWPAYMENTS_API_KEY).",
    });
    return;
  }

  const rawBody = await readVercelRawBody(req);
  await dispatchPaymentRoute(req, res, rawBody);
}
