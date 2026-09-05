"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pageInfo, safeJsonLd, structuredData } from "@/lib/seo";
import { absoluteUrl, indexable } from "@/config/site";
export function RouteMetadata() {
  const pathname = usePathname();
  useEffect(() => {
    const info = pageInfo(pathname);
    document.title = info.title;
    const values: Record<string, string> = {
      robots: `${indexable&&!['/color','/booking'].includes(pathname)?'index':'noindex'}, ${indexable?'follow':'nofollow'}`,
      description: info.description,
      "og:title": info.title,
      "og:description": info.description,
      "og:url": absoluteUrl(pathname),
      "og:image": absoluteUrl(info.image),
      "twitter:title": info.title,
      "twitter:description": info.description,
      "twitter:image": absoluteUrl(info.image),
    };
    for (const [name, content] of Object.entries(values)) {
      const attr = name.startsWith("og:") ? "property" : "name";
      let el = document.head.querySelector<HTMLMetaElement>(
        `meta[${attr}="${name}"]`,
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.append(el);
      }
      el.content = content;
    }
    const canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical) canonical.href = absoluteUrl(pathname);
  }, [pathname]);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData(pathname)) }}
    />
  );
}
