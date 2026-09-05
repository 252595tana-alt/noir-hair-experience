import type { HairColor } from "./hairStyles";
/** Salon policy: update here when a shade's required services change. */
export const colorMenuRequirements: Record<HairColor, string[]> = {
  black: ["color"],
  ash: ["color"],
  silver: ["bleach", "color"],
  blonde: ["bleach", "color"],
  "dark-brown": ["color"],
  beige: ["bleach", "color"],
  red: ["color"],
  pink: ["bleach", "color"],
};
