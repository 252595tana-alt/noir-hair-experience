import sharp from "sharp";
import {
  mkdir,
  readdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SCRIPT_PATH), "..");

export const COLOR_IDS = [
  "black",
  "ash",
  "silver",
  "blonde",
  "dark-brown",
  "beige",
  "red",
  "pink",
];

export const COLOR_WIDTHS = [320, 480, 640, 768];

const SHEET_WIDTH = 1536;
const SHEET_HEIGHT = 1024;
const FRAME_WIDTH = 768;
const FRAME_HEIGHT = 1024;
const COLUMNS = [
  { left: 5, width: 378 },
  { left: 388, width: 378 },
  { left: 770, width: 379 },
  { left: 1153, width: 378 },
];
const ROWS = [5, 515];
const CROP_HEIGHT = 504;
const DERIVATIVE_FILE = /^(?:0[1-8])-(?:\d+)\.(?:avif|webp|jpg)$/;

const masterDir = join(ROOT, "assets", "color-turnarounds");
const publicHairDir = join(ROOT, "public", "hair");
const manifestPath = join(ROOT, "src", "data", "imageManifest.json");

function frameName(index) {
  return String(index + 1).padStart(2, "0");
}

function frameCrops() {
  return ROWS.flatMap((top) =>
    COLUMNS.map(({ left, width }) => ({
      left,
      top,
      width,
      height: CROP_HEIGHT,
    })),
  );
}

async function validateMasters() {
  const expectedNames = COLOR_IDS.map((color) => `${color}.webp`).sort();
  const actualNames = (await readdir(masterDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".webp"))
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error(
      `Color master set must be ${expectedNames.join(", ")}; received ${actualNames.join(", ")}`,
    );
  }

  const masters = [];
  for (const color of COLOR_IDS) {
    const path = join(masterDir, `${color}.webp`);
    const metadata = await sharp(path).metadata();
    if (metadata.width !== SHEET_WIDTH || metadata.height !== SHEET_HEIGHT) {
      throw new Error(
        `${color} master must be ${SHEET_WIDTH}x${SHEET_HEIGHT}; received ${metadata.width}x${metadata.height}`,
      );
    }
    masters.push({ color, path });
  }
  return masters;
}

async function validateCanonicalFrames() {
  const frames = [];
  for (const color of COLOR_IDS) {
    const directory = join(publicHairDir, color);
    const expectedNames = Array.from(
      { length: 8 },
      (_, index) => `${frameName(index)}.webp`,
    );
    const actualNames = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && /^\d{2}\.webp$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
    if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
      throw new Error(
        `${color} canonical set must be ${expectedNames.join(", ")}; received ${actualNames.join(", ")}`,
      );
    }

    for (let index = 0; index < 8; index += 1) {
      const name = frameName(index);
      const path = join(directory, `${name}.webp`);
      const metadata = await sharp(path).metadata();
      if (metadata.width !== FRAME_WIDTH || metadata.height !== FRAME_HEIGHT) {
        throw new Error(
          `${color}/${name}.webp must be ${FRAME_WIDTH}x${FRAME_HEIGHT}; received ${metadata.width}x${metadata.height}`,
        );
      }
      frames.push({ color, name, path });
    }
  }
  if (frames.length !== 64) {
    throw new Error(`Expected 64 canonical color frames; received ${frames.length}`);
  }
  return frames;
}

async function removeDerivedFiles() {
  let removed = 0;
  for (const color of COLOR_IDS) {
    const directory = join(publicHairDir, color);
    await mkdir(directory, { recursive: true });
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && DERIVATIVE_FILE.test(entry.name)) {
        await unlink(join(directory, entry.name));
        removed += 1;
      }
    }
  }
  return removed;
}

async function writeVariant(input, basePath, width, format) {
  const pipeline = sharp(input).resize({
    width,
    withoutEnlargement: true,
    kernel: sharp.kernel.lanczos3,
  });
  const output = `${basePath}-${width}.${format}`;
  if (format === "avif") {
    await pipeline
      .avif({ quality: 72, effort: 4, chromaSubsampling: "4:4:4" })
      .toFile(output);
  } else if (format === "webp") {
    await pipeline
      .webp({ quality: 90, effort: 5, smartSubsample: true })
      .toFile(output);
  } else {
    await pipeline
      .jpeg({
        quality: 92,
        chromaSubsampling: "4:4:4",
        progressive: true,
        mozjpeg: true,
      })
      .toFile(output);
  }
}

async function validateOutput(manifest) {
  if (Object.keys(manifest).length !== 64) {
    throw new Error(
      `Expected 64 image manifest entries; received ${Object.keys(manifest).length}`,
    );
  }

  let derivedFiles = 0;
  let totalBytes = 0;
  for (const color of COLOR_IDS) {
    const directory = join(publicHairDir, color);
    const entries = await readdir(directory, { withFileTypes: true });
    const matching = entries.filter(
      (entry) => entry.isFile() && DERIVATIVE_FILE.test(entry.name),
    );
    if (matching.length !== 8 * COLOR_WIDTHS.length * 3) {
      throw new Error(
        `${color} must contain 96 responsive variants; received ${matching.length}`,
      );
    }
    derivedFiles += matching.length;

    for (let index = 0; index < 8; index += 1) {
      const name = frameName(index);
      const key = `/hair/${color}/${name}.webp`;
      const expected = {
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        widths: COLOR_WIDTHS,
        base: `/hair/${color}/${name}`,
      };
      if (JSON.stringify(manifest[key]) !== JSON.stringify(expected)) {
        throw new Error(`Invalid manifest entry for ${key}`);
      }
      totalBytes += (await stat(join(directory, `${name}.webp`))).size;
      for (const width of COLOR_WIDTHS) {
        for (const format of ["avif", "webp", "jpg"]) {
          totalBytes += (
            await stat(join(directory, `${name}-${width}.${format}`))
          ).size;
        }
      }
    }
  }

  return { canonicalFrames: 64, derivedFiles, totalBytes };
}

export async function prepareColorVariants() {
  const frames = await validateCanonicalFrames();
  const removedFiles = await removeDerivedFiles();
  const manifest = {};

  for (const { color, name, path } of frames) {
    const basePath = join(publicHairDir, color, name);
    await Promise.all(
      COLOR_WIDTHS.flatMap((width) =>
        ["avif", "webp", "jpg"].map((format) =>
          writeVariant(path, basePath, width, format),
        ),
      ),
    );
    manifest[`/hair/${color}/${name}.webp`] = {
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      widths: COLOR_WIDTHS,
      base: `/hair/${color}/${name}`,
    };
  }

  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
  return { removedFiles, ...(await validateOutput(manifest)) };
}

export async function prepareColorAssets() {
  const masters = await validateMasters();
  const crops = frameCrops();

  for (const { color, path } of masters) {
    const directory = join(publicHairDir, color);
    await mkdir(directory, { recursive: true });
    for (let index = 0; index < crops.length; index += 1) {
      const output = join(directory, `${frameName(index)}.webp`);
      await sharp(path)
        .extract(crops[index])
        .resize({
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          fit: "fill",
          kernel: sharp.kernel.lanczos3,
        })
        .sharpen({ sigma: 0.7 })
        .toColourspace("srgb")
        .webp({ quality: 94, effort: 6, smartSubsample: true })
        .toFile(output);
    }
  }

  return prepareColorVariants();
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  const result = await prepareColorAssets();
  console.log(
    JSON.stringify(
      {
        masters: COLOR_IDS.length,
        dimensions: `${FRAME_WIDTH}x${FRAME_HEIGHT}`,
        widths: COLOR_WIDTHS,
        ...result,
      },
      null,
      2,
    ),
  );
}
