import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const salonName=(process.env.NEXT_PUBLIC_SALON_NAME||"NŌIR").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[c]);
const colors = [
  "black",
  "ash",
  "silver",
  "blonde",
  "dark-brown",
  "beige",
  "red",
  "pink",
];
const manifest = {};
for (const color of colors)
  for (let i = 1; i <= 8; i++) {
    const name = String(i).padStart(2, "0"),
      base = `/hair/${color}/${name}`;
    const input = await readFile(`public${base}.webp`),
      meta = await sharp(input).metadata();
    const widths = [...new Set([96,320,640,1024,1600].map(width=>Math.min(width,meta.width)))];
    for (const width of widths)
      for (const format of ["avif", "webp", "jpg"]) {
        const pipeline = sharp(input).resize({
          width,
          withoutEnlargement: true,
        });
        const result =
          format === "avif"
            ? pipeline.avif({ quality: 65 })
            : format === "webp"
              ? pipeline.webp({ quality: 90 })
              : pipeline.jpeg({ quality: 92 });
        await result.toFile(`public${base}-${width}.${format}`);
      }
    manifest[base + ".webp"] = {
      width: widths.at(-1),
      height: Math.round(meta.height*widths.at(-1)/meta.width),
      widths,
      base,
    };
  }
await mkdir("src/data", { recursive: true });
await writeFile("src/data/imageManifest.json", JSON.stringify(manifest));
await mkdir("public/og", { recursive: true });
const styles = [
  ["long", "LONG", "/images/hero.png"],
  ["long-wolf", "WOLF", "/hair/ash/02.webp"],
  ["perm", "PERM", "/hair/dark-brown/08.webp"],
  ["bob", "BOB", "/hair/black/01.webp"],
  ["short", "SHORT", "/hair/ash/03.webp"],
  ["bleach", "BLEACH", "/hair/blonde/02.webp"],
  ["layer", "LAYER", "/hair/beige/08.webp"],
  ["creative", "CREATIVE", "/hair/pink/02.webp"],
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
    .toFile(`public/og/${slug}.jpg`);
}
console.log(
  "64 images: responsive AVIF/WebP/JPEG; 9 OG cards generated. Source resolution is not enlarged for the viewer.",
);
