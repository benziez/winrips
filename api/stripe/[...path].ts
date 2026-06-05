import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleApiCors } from "../_lib/cors.js";
import { handleStripeHttp } from "../_lib/stripeRoutes.js";
import {
  createNodeRequest,
  createNodeResponse,
  readVercelRawBody,
  readVercelRawBodyForWebhook,
} from "../_lib/vercelHttp.js";
import { IncomingMessage, ServerResponse } from "node:http";

export const config = {
  runtime: "nodejs",
  api: {
    bodyParser: false,
  },
};

function stripeRequestPath(req: VercelRequest): string {
  return (req.url ?? "").split("?")[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiCors(req, res)) return;

  const path = stripeRequestPath(req);
  const isStripeWebhook = path === "/api/stripe/webhook";

  const rawBody = isStripeWebhook
    ? await readVercelRawBodyForWebhook(req)
    : await readVercelRawBody(req);

  const nodeReq = createNodeRequest(req, rawBody) as IncomingMessage;
  const nodeRes = createNodeResponse(res) as ServerResponse;
  const handled = await handleStripeHttp(nodeReq, nodeRes);

  if (!handled) {
    res.status(404).json({ error: "Not found" });
  }
}
