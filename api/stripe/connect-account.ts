import type { VercelRequest, VercelResponse } from "@vercel/node";
import { IncomingMessage, ServerResponse } from "node:http";
import { handleApiCors } from "../_lib/cors.js";
import { handleStripeCreateConnectAccountRoute } from "../_lib/stripeConnect.js";
import { createNodeRequest, createNodeResponse, readVercelRawBody } from "../_lib/vercelHttp.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiCors(req, res)) return;

  const rawBody = await readVercelRawBody(req);
  const nodeReq = createNodeRequest(req, rawBody) as IncomingMessage;
  const nodeRes = createNodeResponse(res) as ServerResponse;
  const handled = await handleStripeCreateConnectAccountRoute(nodeReq, nodeRes);

  if (!handled) {
    res.status(405).json({ error: "Method not allowed" });
  }
}
