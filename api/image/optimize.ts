import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleApiCors } from "../_lib/cors.js";

const POKEMON_TCG_HOST = "images.pokemontcg.io";

export const config = {
  runtime: "nodejs",
};

const CACHE_CONTROL = "public, max-age=604800, stale-while-revalidate=86400";

function isAllowedImageUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" && parsed.hostname === POKEMON_TCG_HOST;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleApiCors(req, res)) return;

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  if (!rawUrl || !isAllowedImageUrl(rawUrl)) {
    res.status(400).json({ error: "Invalid or disallowed image URL" });
    return;
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: { Accept: "image/*" },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream image fetch failed" });
      return;
    }

    const source = Buffer.from(await upstream.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const webp = await sharp(source).webp({ quality: 82 }).toBuffer();

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", CACHE_CONTROL);
    res.status(200).send(webp);
  } catch {
    res.status(500).json({ error: "Image optimization failed" });
  }
}
