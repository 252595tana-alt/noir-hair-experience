export type HairUnwovenStyleId = "straight" | "wave" | "bob" | "long";

export type HairUnwovenStyle = {
  /** Gallery-only id. The linked styleId belongs to the existing booking flow. */
  id: HairUnwovenStyleId;
  styleId: "long" | "perm" | "bob" | "layer";
  title: string;
  image: string;
  description: string;
  focusY: number;
};

/**
 * Editorial gallery content. Replacing an image or caption here updates both
 * the WebGL texture and the accessible DOM fallback.
 */
export const hairUnwovenStyles: readonly HairUnwovenStyle[] = [
  {
    id: "straight",
    styleId: "long",
    title: "STRAIGHT",
    image: "/images/styles-v2/long.webp",
    description: "Smooth and minimal.",
    focusY: 0.86,
  },
  {
    id: "wave",
    styleId: "perm",
    title: "WAVE",
    image: "/images/styles-v2/perm.webp",
    description: "Soft movement and texture.",
    focusY: 0.86,
  },
  {
    id: "bob",
    styleId: "bob",
    title: "BOB",
    image: "/images/styles-v2/bob.webp",
    description: "Sharp silhouette.",
    focusY: 0.86,
  },
  {
    id: "long",
    styleId: "layer",
    title: "LONG",
    image: "/images/styles-v2/layer.webp",
    description: "Natural flow.",
    focusY: 0.86,
  },
] as const;

export const hairUnwovenStyleById = (id: string | null) =>
  hairUnwovenStyles.find((style) => style.id === id);
