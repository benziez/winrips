import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Raw body for IPN signature verification (or re-serialized JSON for create). */
export async function readVercelRawBody(req: VercelRequest): Promise<string> {
  const body = req.body;
  if (body !== undefined && body !== null && body !== "") {
    if (typeof body === "string") return body;
    if (Buffer.isBuffer(body)) return body.toString("utf8");
    if (typeof body === "object") return JSON.stringify(body);
  }

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve());
    req.on("error", reject);
  });
  return Buffer.concat(chunks).toString("utf8");
}

export function createNodeRequest(vercelReq: VercelRequest, rawBody: string): IncomingMessage {
  const stream = Readable.from([rawBody]);
  const headers: IncomingMessage["headers"] = {};

  for (const [key, value] of Object.entries(vercelReq.headers)) {
    if (value == null) continue;
    headers[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value;
  }

  return Object.assign(stream, {
    method: vercelReq.method ?? "GET",
    url: vercelReq.url ?? "/",
    headers,
  }) as IncomingMessage;
}

export function createNodeResponse(vercelRes: VercelResponse): ServerResponse {
  let statusCode = 200;
  const headers: Record<string, string> = {};

  const mock = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    setHeader(name: string, value: string | number | readonly string[]) {
      headers[name.toLowerCase()] = String(value);
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
    end(payload?: string | Buffer) {
      const text =
        typeof payload === "string"
          ? payload
          : payload
            ? payload.toString("utf8")
            : "";

      vercelRes.status(statusCode);
      for (const [name, value] of Object.entries(headers)) {
        vercelRes.setHeader(name, value);
      }

      if (headers["content-type"]?.includes("application/json") && text) {
        vercelRes.json(JSON.parse(text) as unknown);
        return;
      }

      vercelRes.send(text);
    },
  };

  return mock as unknown as ServerResponse;
}

/** Runs shared payment API handlers (create, webhook, balance) on Vercel serverless. */
export async function dispatchPaymentRoute(
  vercelReq: VercelRequest,
  vercelRes: VercelResponse,
  rawBody: string,
): Promise<void> {
  const { handlePaymentHttp } = await import("../../src/api/paymentRoutes.js");
  const nodeReq = createNodeRequest(vercelReq, rawBody);
  const nodeRes = createNodeResponse(vercelRes);
  const handled = await handlePaymentHttp(nodeReq, nodeRes);

  if (!handled) {
    vercelRes.status(404).json({ error: "Not found" });
  }
}
