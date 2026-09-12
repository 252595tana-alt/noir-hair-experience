/** Art-directed data maps for the existing, unmodified 1024 × 1536 portrait.
 * These are authored depth/segmentation data, not measured 3D reconstruction.
 * All annotations use source-image pixel coordinates; never swap only the photo.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../public/images/styles-v2/bleach.webp", import.meta.url));
const output = new URL("../public/images/depth-portrait/", import.meta.url);
const outputPath = (name) => fileURLToPath(new URL(name, output));
await mkdir(output, { recursive: true });
const width = 1024, height = 1536;
const raster = async (markup) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="black"/>${markup}</svg>`)).removeAlpha().greyscale().raw().toBuffer();
const envelope = await raster(`<path fill="white" d="M 528 232 C 402 214 304 313 270 462 C 241 583 251 729 225 876 C 202 983 181 1139 209 1229 C 225 1300 266 1359 320 1352 C 379 1313 382 1120 403 1000 C 424 892 437 799 425 742 C 369 679 356 627 359 560 C 371 491 386 436 420 378 C 462 326 532 340 574 388 C 611 433 631 489 641 551 C 659 594 665 625 657 663 C 630 700 623 760 622 826 C 603 940 593 1111 613 1230 C 628 1329 671 1376 729 1356 C 799 1336 828 1246 829 1132 C 835 983 839 884 823 746 C 811 608 780 437 716 341 C 670 271 601 230 528 232 Z"/>`);
// Protect the central face absolutely; translucent fringe above it is selected
// conservatively by the original pixel's luminance/chroma inside the envelope.
const faceExclusion = await raster(`<path fill="white" d="M 412 491 Q 469 480 514 520 Q 566 483 609 496 Q 641 552 654 615 Q 653 693 603 745 Q 555 793 491 778 Q 406 753 378 671 Q 351 606 375 548 Z"/>`);
const fringeRegion = await raster(`<path fill="white" d="M 405 387 Q 469 324 547 363 Q 590 426 620 512 Q 568 483 526 530 Q 496 510 475 458 Q 452 509 391 525 Z"/>`);
const body = await raster(`<path fill="white" d="M 464 744 L 617 745 Q 638 857 814 885 Q 941 909 943 1076 L 934 1536 L 98 1536 L 113 1077 Q 103 939 222 896 Q 426 860 464 744 Z"/>`);
const { data: photo } = await sharp(source).resize(width, height).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const hair = Buffer.alloc(width * height);
for (let i = 0; i < hair.length; i++) {
  const r = photo[i * 3], g = photo[i * 3 + 1], b = photo[i * 3 + 2];
  const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const x = i % width, y = Math.floor(i / width);
  const skin = smooth(23, 46, r - b) * smooth(0.10, 0.23, (r - b) / Math.max(r, 1));
  const protectSkin = fringeRegion[i] > 0 || (y < 620 && x > 365 && x < 665) || (y > 850 && (x < 242 || x > 787));
  const silhouette = Math.max(envelope[i], fringeRegion[i]) / 255;
  const opacity = silhouette * (1 - faceExclusion[i] / 255) * smooth(10, 32, lum) * (protectSkin ? 1 - skin : 1);
  hair[i] = Math.round(opacity * 255);
}
const mask = await sharp(hair, { raw: { width, height, channels: 1 } }).blur(0.65).greyscale().raw().toBuffer();
if (mask.length !== width * height || envelope.length !== width * height || photo.length !== width * height * 3) throw new Error("Unexpected map channel count");
const depth = Buffer.alloc(width * height);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const i = y * width + x;
  const ellipse = ((x - 509) / 157) ** 2 + ((y - 565) / 221) ** 2;
  const face = 1 - smooth(0.72, 1.09, ellipse);
  const nose = Math.exp(-(((x - 508) / 62) ** 2 + ((y - 591) / 78) ** 2));
  const base = 0.07 + body[i] / 255 * 0.29;
  const faceDepth = 0.68 + nose * 0.075;
  let d = base * (1 - face) + faceDepth * face;
  const fringe = (1 - smooth(455, 590, y)) * smooth(290, 390, y);
  const hairDepth = 0.68 - smooth(570, 1360, y) * 0.33 + fringe * 0.18;
  d = d * (1 - mask[i] / 255) + hairDepth * (mask[i] / 255);
  depth[i] = Math.round(d * 255);
}
// Smooth depth boundaries enough for a coarse mobile mesh without stretching faces.
await sharp(depth, { raw: { width, height, channels: 1 } }).blur(9).png().toFile(outputPath("depth.png"));
await sharp(mask, { raw: { width, height, channels: 1 } }).png().toFile(outputPath("hair-mask.png"));
await sharp(source).resize(640, 960).webp({ quality: 88 }).toFile(outputPath("portrait-mobile.webp"));
await sharp(depth, { raw: { width, height, channels: 1 } }).blur(9).resize(384, 576).png().toFile(outputPath("depth-mobile.png"));
await sharp(mask, { raw: { width, height, channels: 1 } }).resize(640, 960).png().toFile(outputPath("hair-mask-mobile.png"));
await writeFile(new URL("manifest.json", output), JSON.stringify({
  source: "/images/styles-v2/bleach.webp", width, height,
  depthConvention: "white-near-black-far", authoring: "image-guided hair matte and manually authored depth regions",
  samples: { background: [70, 200], face: [510, 650], fringe: [335, 410], tips: [720, 1220] },
}, null, 2) + "\n");
console.log("Depth portrait: aligned depth, hair mask, mobile variants and manifest generated.");
