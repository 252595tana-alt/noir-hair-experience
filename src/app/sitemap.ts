import type { MetadataRoute } from "next";
import { indexable, absoluteUrl } from "@/config/site";
import { styles } from "@/data/styles";
import { stylists } from "@/data/stylists";
export default function sitemap(): MetadataRoute.Sitemap {
  return indexable
    ? [
        "/",
        "/style",
        "/stylist",
        "/menu",
        "/salon",
        "/concept",
        ...styles.map((s) => `/style/${s.slug}`),
        ...stylists.map((s) => `/stylist/${s.slug}`),
      ].map((path) => ({ url: absoluteUrl(path) }))
    : [];
}
