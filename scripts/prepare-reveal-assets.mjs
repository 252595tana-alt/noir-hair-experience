/** Offline-only sampling. Runtime particle positions are never updated on the CPU.
 * Registered to the existing portrait matte; flow is an art-directed strand field,
 * not measured optical flow. Float32 seeds: photo UV (Y up), delay, variation.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../public/", import.meta.url);
const out = new URL("images/color-reveal/", root);
const path = (name) => fileURLToPath(new URL(name, out));
await mkdir(out, { recursive: true });
const { data: mask, info } = await sharp(fileURLToPath(new URL("images/depth-portrait/hair-mask.png", root))).greyscale().raw().toBuffer({ resolveWithObject: true });
let state = 0x4e4f4952;
const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
const seeds = new Float32Array(12000 * 4);
let count = 0;
for (let attempt = 0; count < 12000 && attempt < 2000000; attempt++) {
  const x = Math.floor(random() * info.width), y = Math.floor(random() * info.height);
  if (mask[y * info.width + x] < 220) continue;
  seeds.set([(x + .5) / info.width, 1 - (y + .5) / info.height, random(), random()], count++ * 4);
}
if (count !== 12000) throw new Error("Hair matte has too few opaque emission points");
await writeFile(path("seeds.bin"), Buffer.from(seeds.buffer));
await writeFile(path("seeds-mobile.bin"), Buffer.from(seeds.slice(0, 2400 * 4).buffer));
const width = 256, height = 384, flow = Buffer.alloc(width * height * 3);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const u = (x + .5) / width, v = (y + .5) / height;
  const side = u < .5 ? -1 : 1;
  // The center part fans outward at the crown and settles along the lengths.
  const crown = Math.exp(-(((v - .24) / .12) ** 2));
  const dx = side * (.16 + crown * .70 + .05 * Math.sin(v * 14));
  const dy = -(.70 + v * .45);
  const length = Math.hypot(dx, dy), i = (y * width + x) * 3;
  flow[i] = Math.round((dx / length * .5 + .5) * 255);
  flow[i + 1] = Math.round((dy / length * .5 + .5) * 255);
  flow[i + 2] = 128;
}
await sharp(flow, { raw: { width, height, channels: 3 } }).png().toFile(path("flow.png"));
await sharp(flow, { raw: { width, height, channels: 3 } }).resize(128, 192).png().toFile(path("flow-mobile.png"));
await writeFile(path("manifest.json"), JSON.stringify({
  source: "/images/styles-v2/bleach.webp", mask: "/images/depth-portrait/hair-mask.png",
  width: info.width, height: info.height, seedFormat: "little-endian float32: u, v (Y up), delay, variation",
  counts: { desktop: 12000, mobile: 2400 }, maskThreshold: 220,
  flow: "RG = world-space XY direction encoded as direction * 0.5 + 0.5; image-guided, art-directed center part",
}, null, 2) + "\n");
console.log("Color Reveal: registered flow textures and 12,000 / 2,400 matte-sampled seeds generated.");
