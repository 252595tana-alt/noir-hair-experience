export const portraitColors = ["black", "brown", "ash", "beige"] as const;
export type PortraitColor = (typeof portraitColors)[number];
/** A style identifies the photograph AND its registered pair of maps. */
export const depthPortraits = {
  "silk-straight": {
    name: "SILK STRAIGHT",
    salonStyleId: "bleach",
    description: "繊細な前髪と、まっすぐに落ちるシルエット。",
    photo: "/images/styles-v2/bleach.webp",
    mobilePhoto: "/images/depth-portrait/portrait-mobile.webp",
    depth: "/images/depth-portrait/depth.png",
    mobileDepth: "/images/depth-portrait/depth-mobile.png",
    mask: "/images/depth-portrait/hair-mask.png",
    mobileMask: "/images/depth-portrait/hair-mask-mobile.png",
    aspect: 2 / 3,
  },
} as const;
export type DepthPortraitStyle = keyof typeof depthPortraits;
export type DepthPortraitSelection = { style: DepthPortraitStyle; color: PortraitColor };
export const defaultPortraitSelection: DepthPortraitSelection = { style: "silk-straight", color: "beige" };
export const portraitTones = {
  black: { swatch: "#242328", tint: "#34333c", exposure: 0.105, label: "深く、凛としたブラック。" },
  brown: { swatch: "#795844", tint: "#9d7155", exposure: 0.40, label: "光を含む、やわらかなブラウン。" },
  ash: { swatch: "#888b91", tint: "#a5adbd", exposure: 0.67, label: "透明感をまとう、クールなアッシュ。" },
  beige: { swatch: "#bca181", tint: "#d7ba95", exposure: 0.93, label: "肌になじむ、まろやかなベージュ。" },
} as const;
export const portraitQuality = {
  desktop: { segments: [100, 150], dpr: 1.5, noiseOctaves: 2, pointerStrength: 1, fps: 60 },
  mobile: { segments: [36, 54], dpr: 1.25, noiseOctaves: 1, pointerStrength: 0.45, fps: 30 },
} as const;
export function validatePortraitSelection(value: unknown): DepthPortraitSelection | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.style !== "string" || !Object.hasOwn(depthPortraits, candidate.style) || !portraitColors.some((color) => color === candidate.color)) return null;
  return { style: candidate.style as DepthPortraitStyle, color: candidate.color as PortraitColor };
}
export function parsePortraitSelection(params: URLSearchParams) {
  return params.get("source") === "depth-hair-portrait" ? validatePortraitSelection({ style: params.get("style"), color: params.get("color") }) : null;
}
export function portraitBookingPath(selection: DepthPortraitSelection) {
  return "/booking?" + new URLSearchParams({ source: "depth-hair-portrait", ...selection }).toString();
}
export function portraitBookingMessage(selection: DepthPortraitSelection) {
  return ["Depth Hair Portraitで選んだイメージについて予約・相談を希望します。", "",
    `STYLE: ${depthPortraits[selection.style].name}`, `COLOR: ${selection.color.toUpperCase()}`,
    "", "髪の状態に合う施術・料金・所要時間をご相談したいです。"].join("\n");
}
