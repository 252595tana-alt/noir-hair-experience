import type { Metadata } from "next";
import { site, indexable, absoluteUrl } from "@/config/site";
import { styleBySlug } from "@/data/styles";
import { stylists, stylistById } from "@/data/stylists";
export function pageInfo(path: string) {
  const clean = path.split("?")[0];
  const style = clean.startsWith("/style/")
    ? styleBySlug(clean.split("/")[2])
    : undefined;
  const person = clean.startsWith("/stylist/")
    ? stylists.find((s) => s.slug === clean.split("/")[2])
    : undefined;
  const names: Record<string, string> = {
    "/": "HAIR IS IDENTITY.",
    "/style": "ヘアスタイル一覧",
    "/color": "カラーを比較する",
    "/stylist": "スタイリスト",
    "/menu": "メニュー・料金",
    "/booking": "ご予約・相談",
    "/salon": "サロン・アクセス",
    "/concept": "私たちの考え方",
  };
  const label = style
    ? `${style.name} ヘアスタイル`
    : person
      ? `${person.name} / ${person.role}`
      : (names[clean] ?? "ページが見つかりません");
  const description = style
    ? `${style.description} 担当 ${stylistById(style.stylistId)?.name ?? site.name}。カラーを8方向で比較し、メニューと概算料金を確認して予約できます。`
    : person
      ? `${person.name}の得意分野：${person.specialties.join("・")}。担当スタイルを見て、指名・予約を相談できます。`
      : `${site.name}の${label}。スタイル・カラー・担当者・料金を確認し、自分らしい髪を相談できます。`;
  return {
    path: clean,
    title: `${label} | ${site.name}`,
    description,
    label,
    image:
      style?.ogImage ?? (style ? `/og/${style.slug}.jpg` : "/og/salon.jpg"),
    style,
    person,
  };
}
export function metadataFor(path: string): Metadata {
  const info = pageInfo(path);
  return {
    title: info.title,
    description: info.description,
    alternates: { canonical: absoluteUrl(info.path) },
    robots: {
      index: indexable && !["/booking", "/color"].includes(info.path),
      follow: indexable,
    },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      siteName: site.name,
      title: info.title,
      description: info.description,
      url: absoluteUrl(info.path),
      images: [
        {
          url: absoluteUrl(info.image),
          width: 1200,
          height: 630,
          alt: info.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: info.title,
      description: info.description,
      images: [absoluteUrl(info.image)],
    },
  };
}
export function structuredData(path: string) {
  const info = pageInfo(path);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: site.name,
          item: absoluteUrl("/"),
        },
        ...(path === "/"
          ? []
          : [
              {
                "@type": "ListItem",
                position: 2,
                name: info.label,
                item: absoluteUrl(path),
              },
            ]),
      ],
    },
  ];
  if (indexable)
    graph.push({
      "@type": "HairSalon",
      "@id": absoluteUrl("/#salon"),
      name: site.name,
      url: site.url,
      logo: absoluteUrl(site.logo),
      image: absoluteUrl(site.image),
      telephone: site.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address,
        addressLocality: site.locality,
        addressRegion: site.region,
        postalCode: site.postalCode,
        addressCountry: "JP",
      },
      ...(site.openingHours ? { openingHours: site.openingHours } : {}),
      ...(site.priceRange ? { priceRange: site.priceRange } : {}),
      sameAs: [site.instagram, site.mapUrl, site.businessProfileUrl].filter(
        Boolean,
      ),
    });
  if (indexable && info.person)
    graph.push({
      "@type": "Person",
      name: info.person.name,
      jobTitle: info.person.role,
      url: absoluteUrl(path),
      image: absoluteUrl(info.person.image),
      worksFor: { "@id": absoluteUrl("/#salon") },
    });
  return { "@context": "https://schema.org", "@graph": graph };
}
export const safeJsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");
