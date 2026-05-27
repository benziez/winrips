import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleApiCors } from "../../_lib/cors.js";
import { dispatchPaymentRoute, readVercelRawBody } from "../../_lib/vercelHttp.js";

export const config = {
  runtime: "nodejs",
};

/** POST /api/account/balance/dev-set — dev-only (requires DEV_BALANCE_SECRET). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawBody = await readVercelRawBody(req);
  await dispatchPaymentRoute(req, res, rawBody);
}
