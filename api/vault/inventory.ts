import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleApiCors } from "../_lib/cors.js";
import { dispatchPaymentRoute, readVercelRawBody } from "../_lib/vercelHttp.js";

export const config = {
  runtime: "nodejs",
};

/** GET/POST /api/vault/inventory — per-user vault locker (Vercel serverless). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiCors(req, res)) return;

  const rawBody = await readVercelRawBody(req);
  await dispatchPaymentRoute(req, res, rawBody);
}
