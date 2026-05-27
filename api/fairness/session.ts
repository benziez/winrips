import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createFairnessSeedSession,
  revealFairnessSeedSession,
} from "../_lib/fairnessSeeds.js";

export const config = {
  runtime: "nodejs",
};

interface FairnessSessionRequest {
  action?: "create" | "reveal";
  packId?: string;
  sessionId?: string;
}

function parseRequestBody(req: VercelRequest): FairnessSessionRequest {
  const body = req.body;
  if (!body || typeof body !== "object") return {};
  return body as FairnessSessionRequest;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const payload = parseRequestBody(req);
  if (payload.action === "create") {
    const packId = typeof payload.packId === "string" ? payload.packId.trim() : "";
    if (!packId) {
      res.status(400).json({ error: "packId is required" });
      return;
    }
    const created = createFairnessSeedSession(packId);
    res.status(200).json(created);
    return;
  }

  if (payload.action === "reveal") {
    const sessionId = typeof payload.sessionId === "string" ? payload.sessionId.trim() : "";
    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }
    const revealed = revealFairnessSeedSession(sessionId);
    if (!revealed) {
      res.status(404).json({ error: "Fairness session not found or expired." });
      return;
    }
    res.status(200).json({ serverSeed: revealed.serverSeed, serverSeedHash: revealed.serverSeedHash });
    return;
  }

  res.status(400).json({ error: "Invalid fairness session action." });
}
