import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// This samples the existing photograph; it never modifies the image itself.
// Coordinates use the original image's top-left origin, before object-fit cropping.
const source = new URL("../public/images/hero.png", import.meta.url);
const destination = new URL("../public/data/hero-particles.json", import.meta.url);
const input = await readFile(source);
const metadata = await sharp(input).metadata();
const { data, info } = await sharp(input)
  .resize({ width: 512, withoutEnlargement: true })
  .removeAlpha()
  .toColourspace("srgb")
  .raw()
  .toBuffer({ resolveWithObject: true });

const count = 6000;
const columns = 20;
const rows = Math.round(columns * info.height / info.width);
const buckets = Array.from({ length: columns * rows }, () => []);
let seed = 0x4e4f4952;
const random = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) + 1) / 4294967297;
};
const round = (value) => Number(value.toFixed(4));

for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const offset = (y * info.width + x) * info.channels;
    const r = data[offset] / 255;
    const g = data[offset + 1] / 255;
    const b = data[offset + 2] / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Reject the almost-black studio backdrop, retaining the dark hair strands.
    if (luminance < 0.055 || Math.max(r, g, b) < 0.07) continue;
    const column = Math.min(columns - 1, Math.floor(x / info.width * columns));
    const row = Math.min(rows - 1, Math.floor(y / info.height * rows));
    // An exponential race orders highlights first without dropping dark hair.
    const priority = -Math.log(random()) / (0.35 + 0.65 * Math.sqrt(luminance));
    buckets[row * columns + column].push({
      priority,
      point: [
        round((x + 0.5) / info.width), round((y + 0.5) / info.height),
        round(r), round(g), round(b),
      ],
    });
  }
}

const active = buckets.filter((bucket) => bucket.length);
for (const bucket of active) bucket.sort((a, b) => b.priority - a.priority);
const points = [];
// Each pass visits all occupied cells in a new deterministic order. The first
// 600 or 2000 points therefore cover the whole portrait, as does the full set.
while (points.length / 5 < count && active.length) {
  for (let i = active.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [active[i], active[j]] = [active[j], active[i]];
  }
  for (let i = active.length - 1; i >= 0 && points.length / 5 < count; i--) {
    const candidate = active[i].pop();
    if (candidate) points.push(...candidate.point);
    if (!active[i].length) active.splice(i, 1);
  }
}
if (points.length !== count * 5) throw new Error(`Only ${points.length / 5} foreground pixels found.`);

const json = JSON.stringify({ width: metadata.width, height: metadata.height, points });
await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(destination, json + "\n");
console.log(`Sampled ${count} portrait particles from ${metadata.width}×${metadata.height}.`);
console.log(`${fileURLToPath(destination)} (${Buffer.byteLength(json) + 1} bytes)`);
