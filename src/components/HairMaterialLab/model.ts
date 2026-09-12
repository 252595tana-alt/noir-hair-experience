/** This contract is independent of the gallery, journey and wind scenes. */
export const materialStyles = ["straight", "wave"] as const;
export const materialColors = ["black", "brown", "ash", "beige"] as const;
export const materialTextures = ["matte", "natural", "silky"] as const;

export type HairMaterialSelection = {
  style: (typeof materialStyles)[number];
  color: (typeof materialColors)[number];
  texture: (typeof materialTextures)[number];
};

export const defaultMaterialSelection: HairMaterialSelection = {
  style: "straight", color: "brown", texture: "natural",
};

export const materialPalette = {
  black: "#28252a", brown: "#79513a", ash: "#777578", beige: "#ba9770",
} satisfies Record<HairMaterialSelection["color"], string>;

export const textureProfiles = {
  matte: { roughness: 0.78, specular: 0.16, highlight: 0.23, description: "光をやわらかく含む、落ち着いた質感。" },
  natural: { roughness: 0.44, specular: 0.48, highlight: 0.62, description: "素髪のように、自然なツヤとやわらかさ。" },
  silky: { roughness: 0.18, specular: 0.86, highlight: 1.08, description: "毛流れに沿って、シルクの光がすべる。" },
} as const;

export function parseMaterialSelection(params: URLSearchParams): HairMaterialSelection | null {
  if (params.get("source") !== "hair-material-lab") return null;
  const style = params.get("style");
  const color = params.get("color");
  const texture = params.get("texture");
  if (!materialStyles.some((v) => v === style) || !materialColors.some((v) => v === color) || !materialTextures.some((v) => v === texture)) return null;
  return { style, color, texture } as HairMaterialSelection;
}

export function materialBookingPath(selection: HairMaterialSelection) {
  return "/booking?" + new URLSearchParams({ source: "hair-material-lab", ...selection }).toString();
}

export function materialBookingMessage(selection: HairMaterialSelection) {
  return ["Hair Material Labで選んだイメージについて予約・相談を希望します。", "",
    `STYLE: ${selection.style.toUpperCase()}`,
    `COLOR: ${selection.color.toUpperCase()}`,
    `TEXTURE: ${selection.texture.toUpperCase()}`,
    "", "髪の状態に合う施術・料金・所要時間をご相談したいです。"].join("\n");
}
