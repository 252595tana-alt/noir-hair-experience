export const hairColors = [
  {
    id: "black",
    name: "BLACK",
    ja: "ブラック",
    hex: "#343438",
    accent: "#b6b5b0",
  },
  {
    id: "ash",
    name: "ASH GRAY",
    ja: "アッシュグレー",
    hex: "#777a76",
    accent: "#a4aea7",
  },
  {
    id: "silver",
    name: "SILVER",
    ja: "シルバー",
    hex: "#c7c9cc",
    accent: "#c7c9cc",
  },
  {
    id: "blonde",
    name: "BLONDE",
    ja: "ブロンド",
    hex: "#c9ad75",
    accent: "#c9ad75",
  },
  {
    id: "dark-brown",
    name: "DARK BROWN",
    ja: "ダークブラウン",
    hex: "#634539",
    accent: "#b7927a",
  },
  {
    id: "beige",
    name: "MILK TEA BEIGE",
    ja: "ミルクティーベージュ",
    hex: "#bba58e",
    accent: "#cbbb9f",
  },
  { id: "red", name: "RED", ja: "レッド", hex: "#9d3437", accent: "#d27e76" },
  { id: "pink", name: "PINK", ja: "ピンク", hex: "#c992a4", accent: "#d6a9ba" },
] as const;
export type HairColor = (typeof hairColors)[number]["id"];
export const hairStyles = Object.fromEntries(
  hairColors.map(({ id }) => [
    id,
    Array.from(
      { length: 8 },
      (_, i) => `/hair/${id}/${String(i + 1).padStart(2, "0")}.webp`,
    ),
  ]),
) as Record<HairColor, string[]>;
export const colorById = (id: HairColor) =>
  hairColors.find((color) => color.id === id)!;
