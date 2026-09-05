import { hairColors, hairStyles, type HairColor } from "./hairStyles";
import { estimate, timeBufferMin } from "./menu";
import { colorMenuRequirements } from "./colorMenus";
export type HairStyle = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  stylistId: string;
  recommendedMenus: string[];
  estimatedPriceFrom: number;
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  availableColors: HairColor[];
  defaultColor: HairColor;
  heroImage: string;
  ogImage?: string;
  hairImages: Record<HairColor, string[]>;
  detail: string;
  tags: string;
  image: string;
  position: string;
};
const baseStyles = [
  {
    id: "long",
    slug: "long",
    name: "LONG",
    detail: "流れるライン、揺るがない個性。",
    tags: "SOFT LAYERS / NATURAL MOVEMENT",
    stylistId: "takuya",
    image: "/images/hero.png",
    position: "center 38%",
  },
  {
    id: "long-wolf",
    slug: "long-wolf",
    name: "WOLF",
    detail: "ラフな動きに、意志を宿す。",
    tags: "FACE FRAMING / TEXTURED ENDS",
    stylistId: "takuya",
    image: "/hair/ash/02.webp",
    position: "center",
  },
  {
    id: "perm",
    slug: "perm",
    name: "PERM",
    detail: "計算しすぎない、美しいリズム。",
    tags: "AIRY TEXTURE / SOFT CURL",
    stylistId: "ren",
    image: "/hair/dark-brown/08.webp",
    position: "center",
  },
  {
    id: "bob",
    slug: "bob",
    name: "BOB",
    detail: "シンプルだからこそ、私らしく。",
    tags: "CLEAN LINE / SILKY FINISH",
    stylistId: "yuki",
    image: "/hair/black/01.webp",
    position: "center",
  },
  {
    id: "short",
    slug: "short",
    name: "SHORT",
    detail: "余白で魅せる、新しいバランス。",
    tags: "SCULPTED SHAPE / LIGHT FEEL",
    stylistId: "ren",
    image: "/hair/ash/03.webp",
    position: "center",
  },
  {
    id: "bleach",
    slug: "bleach",
    name: "BLEACH",
    detail: "色からはじまる、次の私。",
    tags: "HIGH TONE / TRANSLUCENT COLOR",
    stylistId: "yuki",
    image: "/hair/blonde/02.webp",
    position: "center",
  },
  {
    id: "layer",
    slug: "layer",
    name: "LAYER",
    detail: "重なりがつくる、軽やかな表情。",
    tags: "DIMENSION / EFFORTLESS LAYERS",
    stylistId: "takuya",
    image: "/hair/beige/08.webp",
    position: "center",
  },
  {
    id: "creative",
    slug: "creative",
    name: "CREATIVE",
    detail: "まだ知らない、自分に出会う。",
    tags: "PERSONAL EXPRESSION / NEW FORM",
    stylistId: "yuki",
    image: "/hair/pink/02.webp",
    position: "center",
  },
] as const;
const defaults: HairColor[] = [
  "black",
  "ash",
  "dark-brown",
  "black",
  "ash",
  "blonde",
  "beige",
  "pink",
];
export const styles: HairStyle[] = baseStyles.map((style, index) => {
  const recommendedMenus =
    style.id === "perm" ? ["cut", "perm"] : ["cut", "color"];
  const plan = estimate([
    ...recommendedMenus,
    ...colorMenuRequirements[defaults[index]],
  ]);
  return {
    ...style,
    category: style.name,
    description: style.detail,
    defaultColor: defaults[index],
    heroImage: style.image,
    hairImages: hairStyles,
    availableColors: ["perm", "bob"].includes(style.id)
      ? ["black", "ash", "dark-brown", "beige"]
      : hairColors.map((c) => c.id),
    recommendedMenus,
    estimatedPriceFrom: plan.total,
    estimatedTimeMin: plan.minutes,
    estimatedTimeMax: plan.minutes + timeBufferMin,
  };
});
export const styleById = (id: string | null) =>
  styles.find((style) => style.id === (id === "wolf" ? "long-wolf" : id));
export const styleBySlug = (slug: string) =>
  styles.find((style) => style.slug === slug);
