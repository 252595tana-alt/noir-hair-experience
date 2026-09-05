import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// This samples the existing photograph; it never modifies the image itself.
// Coordinates use the original image's top-left origin, before object-fit cropping.
const source = new URL("../public/images/hero-360/front-v2.webp", import.meta.url);
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
const edgeBuckets = Array.from({ length: columns * rows }, () => []);
const luminanceMap = new Float32Array(info.width * info.height);
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
    luminanceMap[y * info.width + x] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}

const at = (x, y) => luminanceMap[
  Math.max(0, Math.min(info.height - 1, y)) * info.width +
  Math.max(0, Math.min(info.width - 1, x))
];
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const offset = (y * info.width + x) * info.channels;
    const r = data[offset] / 255;
    const g = data[offset + 1] / 255;
    const b = data[offset + 2] / 255;
    const luminance = luminanceMap[y * info.width + x];
    // Reject the almost-black studio backdrop, retaining the dark hair strands.
    if (luminance < 0.055 || Math.max(r, g, b) < 0.07) continue;
    const gradientX = at(x + 1, y) - at(x - 1, y);
    const gradientY = at(x, y + 1) - at(x, y - 1);
    const edge = Math.min(1, Math.hypot(gradientX, gradientY) * 4.5);
    const nx = (x + 0.5) / info.width;
    const ny = (y + 0.5) / info.height;
    const faceFocus = Math.exp(-(
      ((nx - 0.47) / 0.3) ** 2 + ((ny - 0.36) / 0.32) ** 2
    ));
    const column = Math.min(columns - 1, Math.floor(x / info.width * columns));
    const row = Math.min(rows - 1, Math.floor(y / info.height * rows));
    // Edge, face and highlight weighting makes the first mobile LOD readable.
    // The exponential race keeps dark hair eligible instead of thresholding it out.
    const weight = 0.18 + edge * 2.8 + Math.sqrt(luminance) * 0.75 + faceFocus * 0.7;
    const priority = -Math.log(random()) / weight;
    const candidate = {
      priority,
      selected: false,
      point: [
        round(nx), round(ny),
        round(r), round(g), round(b),
      ],
    };
    buckets[row * columns + column].push(candidate);
    if (edge > .055 || (faceFocus > .35 && edge > .025)) {
      edgeBuckets[row * columns + column].push(candidate);
    }
  }
}

for (const bucket of buckets) bucket.sort((a, b) => b.priority - a.priority);
for (const bucket of edgeBuckets) bucket.sort((a, b) => b.priority - a.priority);
const points = [];
const drain = (active, limit) => {
  while (points.length / 5 < limit && active.length) {
    for (let i = active.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [active[i], active[j]] = [active[j], active[i]];
    }
    for (let i = active.length - 1; i >= 0 && points.length / 5 < limit; i--) {
      const candidate = active[i].pop();
      if (candidate && !candidate.selected) {
        candidate.selected = true;
        points.push(...candidate.point);
      }
      if (!active[i].length) active.splice(i, 1);
    }
  }
};
// Low and mobile tiers use the leading points, so first concentrate them on
// the face and flowing hair. The remaining points restore the full silhouette.
const focusRows = Math.ceil(rows * 0.82);
drain(edgeBuckets.slice(0, columns * focusRows).filter((bucket) => bucket.length), 500);
drain(buckets.slice(0, columns * focusRows).filter((bucket) => bucket.length), 900);
drain(buckets.filter((bucket) => bucket.length), count);
if (points.length !== count * 5) throw new Error(`Only ${points.length / 5} foreground pixels found.`);

const json = JSON.stringify({ width: metadata.width, height: metadata.height, points });
await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(destination, json + "\n");
console.log(`Sampled ${count} portrait particles from ${metadata.width}×${metadata.height}.`);
console.log(`${fileURLToPath(destination)} (${Buffer.byteLength(json) + 1} bytes)`);
