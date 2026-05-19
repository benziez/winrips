import type { VercelRequest, VercelResponse } from "@vercel/node";
import { dispatchPaymentRoute } from "../_lib/vercelHttp.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  await dispatchPaymentRoute(req, res, "");
}
