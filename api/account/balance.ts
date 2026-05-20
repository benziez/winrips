import type { VercelRequest, VercelResponse } from "@vercel/node";
import { dispatchPaymentRoute, readVercelRawBody } from "../_lib/vercelHttp.js";

export const config = {
  runtime: "nodejs",
};

/** GET /api/account/balance?userId=... — Vercel serverless (Node). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawBody = await readVercelRawBody(req);
  await dispatchPaymentRoute(req, res, rawBody);
}
