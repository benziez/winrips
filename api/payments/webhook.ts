import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleApiCors } from "../_lib/cors.js";
import { dispatchPaymentRoute, readVercelRawBodyForWebhook } from "../_lib/vercelHttp.js";

export const config = {
  runtime: "nodejs",
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawBody = await readVercelRawBodyForWebhook(req);
  await dispatchPaymentRoute(req, res, rawBody);
}
