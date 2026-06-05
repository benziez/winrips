import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PACKS_DIR = path.resolve("src/assets/packs");
const MAX_BYTES = 100 * 1024;
const MAX_WIDTH = 420;

const pngFiles = fs
  .readdirSync(PACKS_DIR)
  .filter((name) => name.toLowerCase().endsWith(".png"));

if (pngFiles.length === 0) {
  console.log("No PNG pack covers to convert.");
  process.exit(0);
}

for (const file of pngFiles) {
  const inputPath = path.join(PACKS_DIR, file);
  const outputPath = path.join(PACKS_DIR, file.replace(/\.png$/i, ".webp"));

  let quality = 82;
  let buffer = null;

  while (quality >= 48) {
    buffer = await sharp(inputPath)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();

    if (buffer.length <= MAX_BYTES) break;
    quality -= 6;
  }

  if (!buffer || buffer.length > MAX_BYTES) {
    console.warn(`⚠ ${file}: could not reach ${MAX_BYTES} bytes (got ${buffer?.length ?? 0})`);
  }

  fs.writeFileSync(outputPath, buffer);
  fs.unlinkSync(inputPath);
  console.log(
    `${file} → ${path.basename(outputPath)} (${Math.round(buffer.length / 1024)}KB, q=${quality})`,
  );
}
