import { depthPortraits } from "../DepthHairPortrait/model";

export const revealColors = ["black", "brown", "ash", "beige", "silver"] as const;
export type RevealColor = (typeof revealColors)[number];
// Keep the photograph, matte and strand-flow field registered as one asset.
export const revealStyles = {
  "silk-straight": {
    ...depthPortraits["silk-straight"],
    flow: "/images/color-reveal/flow.png",
    mobileFlow: "/images/color-reveal/flow-mobile.png",
    seeds: "/images/color-reveal/seeds.bin",
    mobileSeeds: "/images/color-reveal/seeds-mobile.bin",
  },
} as const;
export type RevealSelection = { style: keyof typeof revealStyles; color: RevealColor };
export const defaultRevealSelection: RevealSelection = { style: "silk-straight", color: "beige" };
export const revealTones = {
  black: { swatch: "#25252a", tint: "#34333c", exposure: .105, description: "静かな強さを宿す、深いブラック。" },
  brown: { swatch: "#795844", tint: "#9d7155", exposure: .40, description: "光にほどける、やわらかなブラウン。" },
  ash: { swatch: "#888b91", tint: "#a5adbd", exposure: .67, description: "くすみと透明感が重なる、クールなアッシュ。" },
  beige: { swatch: "#bca181", tint: "#d7ba95", exposure: .93, description: "肌にとけこむ、まろやかなベージュ。" },
  silver: { swatch: "#c6cbd2", tint: "#d9e0ec", exposure: 1.23, description: "繊細な光をまとう、澄んだシルバー。" },
} as const;
export const revealQuality = {
  desktop: { count: 12000, dpr: 1.5, noiseOctaves: 3, noise: .055, fps: 60 },
  mobile: { count: 2400, dpr: 1, noiseOctaves: 1, noise: .025, fps: 30 },
} as const;
export const revealDuration = 2.6;
export const revealEase = (progress: number) => { const p = Math.max(0, Math.min(1, progress)); return p * p * (3 - 2 * p); };
export function validateRevealSelection(value: unknown): RevealSelection | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  return typeof v.style === "string" && Object.hasOwn(revealStyles, v.style) && revealColors.some((color) => color === v.color)
    ? { style: v.style as RevealSelection["style"], color: v.color as RevealColor } : null;
}
export function parseRevealSelection(params: URLSearchParams) {
  return params.get("source") === "hair-color-particle-reveal"
    ? validateRevealSelection({ style: params.get("style"), color: params.get("color") }) : null;
}
export function revealBookingPath(selection: RevealSelection) {
  return "/booking?" + new URLSearchParams({ source: "hair-color-particle-reveal", ...selection }).toString();
}
export function revealBookingMessage(selection: RevealSelection) {
  return ["Hair Color Particle Revealで選んだイメージについて予約・相談を希望します。", "",
    `STYLE: ${revealStyles[selection.style].name}`, `COLOR: ${selection.color.toUpperCase()}`, "",
    "髪の状態に合う施術・料金・所要時間をご相談したいです。"].join("\n");
}
