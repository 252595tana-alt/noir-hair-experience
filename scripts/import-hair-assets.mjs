import { readdir, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import sharp from "sharp";
// Extract the supplied archive first; pass its hair_color_variations_64 directory.
const source = process.argv[2];
if (!source)
  throw new Error(
    "Usage: node scripts/import-hair-assets.mjs <extracted-directory>",
  );
const mapping = {
  "01_silver_white": "silver",
  "02_ash_gray": "ash",
  "03_blond": "blonde",
  "04_dark_brown": "dark-brown",
  "05_milk_tea_beige": "beige",
  "06_red": "red",
  "07_blue_black": "black",
  "08_pink": "pink",
};
// The supplied tiles include progressively larger strips of the previous row.
// Remove those separators and use the same 100px head region for comparison.
const topOffsets = {
  silver: 0,
  ash: 0,
  blonde: 4,
  "dark-brown": 8,
  beige: 12,
  red: 16,
  black: 19,
  pink: 24,
};
const report = [];
for (const [folder, color] of Object.entries(mapping)) {
  const files = (await readdir(join(source, folder)))
    .filter((f) => f.endsWith(".jpg"))
    .sort();
  if (files.length !== 8) throw new Error(`Expected eight frames: ${folder}`);
  await mkdir(resolve("public/hair", color), { recursive: true });
  for (let i = 0; i < files.length; i++) {
    const input = join(source, folder, files[i]);
    const metadata = await sharp(input).metadata();
    await sharp(input)
      .extract({
        left: 0,
        top: topOffsets[color],
        width: metadata.width,
        height: 100,
      })
      .webp({ lossless: true })
      .toFile(
        resolve("public/hair", color, `${String(i + 1).padStart(2, "0")}.webp`),
      );
    report.push({
      color,
      angle: i,
      width: metadata.width,
      height: metadata.height,
    });
  }
}
console.log(
  JSON.stringify(
    {
      frames: report.length,
      dimensions: [...new Set(report.map((r) => `${r.width}x${r.height}`))],
      mapping,
    },
    null,
    2,
  ),
);
