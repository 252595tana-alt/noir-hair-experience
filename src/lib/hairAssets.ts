import manifest from "@/data/imageManifest.json";
import type { PerformanceTier } from "@/hooks/usePerformanceTier";

type HairAsset = {
  width: number;
  height: number;
  widths: number[];
  base: string;
};

const assets = manifest as Record<string, HairAsset>;

export function resolveHairAsset(
  canonicalUrl: string,
  targetWidth: number,
  format: "avif" | "webp" | "jpg" = "webp",
) {
  const asset = assets[canonicalUrl];
  if (!asset) return canonicalUrl;
  const width =
    asset.widths.find((candidate) => candidate >= targetWidth) ??
    asset.widths.at(-1) ??
    asset.width;
  return `${asset.base}-${width}.${format}`;
}

export function hairTextureWidth(tier: PerformanceTier) {
  if (tier === "high") return 768;
  if (tier === "medium") return 640;
  return 480;
}

export const hairImageSizes =
  "(max-width:700px) 88vw, (max-width:1024px) 43vw, 34vw";
