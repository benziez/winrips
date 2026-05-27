import type { VercelRequest, VercelResponse } from "@vercel/node";
import { IncomingMessage, ServerResponse } from "node:http";
import { handleApiCors } from "../_lib/cors.js";
import { handleIapFulfillRoute } from "../_lib/iapFulfill.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiCors(req, res)) return;

  const nodeReq = req as unknown as IncomingMessage;
  const nodeRes = res as unknown as ServerResponse;
  const handled = await handleIapFulfillRoute(nodeReq, nodeRes);
  if (!handled) {
    res.status(405).json({ error: "Method not allowed" });
  }
}
