import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import nextEnv from "@next/env";
import { prepareColorVariants } from "./prepare-color-assets.mjs";
nextEnv.loadEnvConfig(process.cwd());
const salonName=(process.env.NEXT_PUBLIC_SALON_NAME||"NŌIR").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[c]);
const colorAssets = await prepareColorVariants();
await mkdir("public/og", { recursive: true });
const styles = [
  ["long", "LONG", "/images/styles-v2/long.webp"],
  ["long-wolf", "WOLF", "/images/styles-v2/long-wolf.webp"],
  ["perm", "PERM", "/images/styles-v2/perm.webp"],
  ["bob", "BOB", "/images/styles-v2/bob.webp"],
  ["short", "SHORT", "/images/styles-v2/short.webp"],
  ["bleach", "BLEACH", "/images/styles-v2/bleach.webp"],
  ["layer", "LAYER", "/images/styles-v2/layer.webp"],
  ["creative", "CREATIVE", "/images/styles-v2/creative.webp"],
  ["salon", "HAIR IS IDENTITY.", "/images/hero.png"],
];
for (const [slug, name, path] of styles) {
  const photo = await sharp("public" + path)
    .resize(580, 630, { fit: "contain", background: "#080809" })
    .toBuffer();
  const title = Buffer.from(
    `<svg width="1200" height="630"><rect width="620" height="630" fill="#050505"/><text x="65" y="140" fill="#f5f5f2" font-family="sans-serif" font-size="45">${salonName}</text><text x="65" y="335" fill="#f5f5f2" font-family="sans-serif" font-size="44">${name}</text><text x="65" y="395" fill="#aaaaaa" font-family="sans-serif" font-size="18">HAIR DESIGN STUDIO</text></svg>`,
  );
  await sharp({
    create: { width: 1200, height: 630, channels: 3, background: "#050505" },
  })
    .composite([
      { input: photo, left: 620, top: 0 },
      { input: title, left: 0, top: 0 },
    ])
    .jpeg({ quality: 85 })
    .toFile(`public/og/${slug === "salon" ? slug : `${slug}-v2`}.jpg`);
}
console.log(
  `64 color images: ${colorAssets.derivedFiles} responsive AVIF/WebP/JPEG variants at 320/480/640/768px; 9 OG cards generated.`,
);
