import type { VercelRequest, VercelResponse } from "@vercel/node";
import { IncomingMessage, ServerResponse } from "node:http";
import { handleApiCors } from "../_lib/cors.js";
import { handleStripeHttp } from "../_lib/stripeRoutes.js";
import { getStripeRequestPath, stripePathFromVercelRequest } from "../_lib/stripeRouteMatch.js";
import {
  createNodeRequest,
  createNodeResponse,
  readVercelRawBody,
  readVercelRawBodyForWebhook,
} from "../_lib/vercelHttp.js";

export const config = {
  runtime: "nodejs",
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiCors(req, res)) return;

  const normalizedPath = stripePathFromVercelRequest(req);
  const isStripeWebhook = normalizedPath === "/api/stripe/webhook";

  const rawBody = isStripeWebhook
    ? await readVercelRawBodyForWebhook(req)
    : await readVercelRawBody(req);

  const nodeReq = createNodeRequest(req, rawBody) as IncomingMessage;
  nodeReq.url = normalizedPath;

  const nodeRes = createNodeResponse(res) as ServerResponse;
  const handled = await handleStripeHttp(nodeReq, nodeRes);

  if (!handled) {
    console.warn("[stripe] unmatched route", {
      method: req.method,
      rawUrl: req.url,
      normalizedPath: getStripeRequestPath(nodeReq),
      pathQuery: req.query.path,
    });
    res.status(404).json({ error: "Not found" });
  }
}
