/**
 * Upload src/assets/packs/*.{webp,svg} to public Supabase Storage bucket `pack-covers`.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = join(__dirname, "../src/assets/packs");
const PROJECT_REF = "zyqcvmjziyebiuazkggo";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const BUCKET = "pack-covers";

function loadEnvFromFile() {
  try {
    const text = readFileSync(join(__dirname, "../.env"), "utf8");
    for (const line of text.split("\n")) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(match[1] in process.env)) process.env[match[1]] = value;
    }
  } catch {
    /* optional */
  }
}

function contentType(filename) {
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function main() {
  loadEnvFromFile();

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    throw new Error("Set SUPABASE_SERVICE_ROLE_KEY in .env");
  }

  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  const existing = buckets?.find((bucket) => bucket.name === BUCKET);
  if (!existing) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 512 * 1024,
    });
    if (createError) throw createError;
    console.log(`Created public bucket "${BUCKET}"`);
  } else if (!existing.public) {
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
    });
    if (updateError) throw updateError;
    console.log(`Updated bucket "${BUCKET}" to public`);
  } else {
    console.log(`Bucket "${BUCKET}" already exists (public)`);
  }

  const files = readdirSync(PACKS_DIR).filter((name) => /\.(webp|svg)$/i.test(name));
  if (files.length === 0) {
    throw new Error(`No pack cover files found in ${PACKS_DIR}`);
  }

  for (const filename of files.sort()) {
    const filePath = join(PACKS_DIR, filename);
    const body = readFileSync(filePath);
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filename, body, {
      contentType: contentType(filename),
      upsert: true,
      cacheControl: "31536000",
    });
    if (uploadError) throw uploadError;
    console.log(`Uploaded ${filename} (${Math.round(body.length / 1024)}KB)`);
  }

  console.log(
    `\nPublic CDN base: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
