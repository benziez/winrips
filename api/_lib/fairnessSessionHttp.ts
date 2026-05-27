import type { IncomingMessage, ServerResponse } from "node:http";
import {
  createFairnessSeedSession,
  revealFairnessSeedSession,
} from "./fairnessSeeds.js";

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as unknown);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export async function handleFairnessSessionRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = req.url?.split("?")[0] ?? "";
  if (url !== "/api/fairness/session" || req.method !== "POST") {
    return false;
  }

  try {
    const body = (await readJsonBody(req)) as {
      action?: string;
      packId?: string;
      sessionId?: string;
    };

    if (body.action === "create") {
      const packId = typeof body.packId === "string" ? body.packId.trim() : "";
      if (!packId) {
        sendJson(res, 400, { error: "packId is required" });
        return true;
      }
      sendJson(res, 200, createFairnessSeedSession(packId));
      return true;
    }

    if (body.action === "reveal") {
      const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
      if (!sessionId) {
        sendJson(res, 400, { error: "sessionId is required" });
        return true;
      }
      const revealed = revealFairnessSeedSession(sessionId);
      if (!revealed) {
        sendJson(res, 404, { error: "Fairness session not found or expired." });
        return true;
      }
      sendJson(res, 200, {
        serverSeed: revealed.serverSeed,
        serverSeedHash: revealed.serverSeedHash,
      });
      return true;
    }

    sendJson(res, 400, { error: "Invalid fairness session action." });
    return true;
  } catch {
    sendJson(res, 500, { error: "Unable to process fairness session request." });
    return true;
  }
}
