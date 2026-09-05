/** Public deployment configuration only. Never put credentials in this module. */
export function safeHttps(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export const site = {
  url:
    safeHttps(process.env.NEXT_PUBLIC_SITE_URL) ?? "https://example.invalid/",
  name: process.env.NEXT_PUBLIC_SALON_NAME || "NŌIR",
  published: process.env.NEXT_PUBLIC_SITE_PUBLISHED === "true",
  verified: process.env.NEXT_PUBLIC_SALON_VERIFIED === "true",
  lineUrl: safeHttps(process.env.NEXT_PUBLIC_LINE_BOOKING_URL),
  webUrl: safeHttps(process.env.NEXT_PUBLIC_WEB_BOOKING_URL),
  instagram: safeHttps(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  mapUrl: safeHttps(process.env.NEXT_PUBLIC_GOOGLE_MAP_URL),
  businessProfileUrl: safeHttps(
    process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_PROFILE_URL,
  ),
  phone: process.env.NEXT_PUBLIC_PHONE || "",
  address: process.env.NEXT_PUBLIC_ADDRESS || "",
  postalCode: process.env.NEXT_PUBLIC_POSTAL_CODE || "",
  locality: process.env.NEXT_PUBLIC_LOCALITY || "",
  region: process.env.NEXT_PUBLIC_REGION || "",
  openingHours: process.env.NEXT_PUBLIC_OPENING_HOURS || "",
  closed: process.env.NEXT_PUBLIC_CLOSED || "",
  parking: process.env.NEXT_PUBLIC_PARKING || "",
  priceRange: process.env.NEXT_PUBLIC_PRICE_RANGE || "",
  logo: "/icon.svg",
  image: "/images/hero.png",
};
export const indexable =
  site.published &&
  site.verified &&
  !site.url.includes("example.invalid") &&
  Boolean(site.address && site.phone && (site.lineUrl || site.webUrl));
export const absoluteUrl = (path: string) => new URL(path, site.url).href;
export const salonDetails = [
  ["ADDRESS", site.address || "正式な住所は準備中です"],
  ["OPEN", site.openingHours || "営業時間は準備中です"],
  ["CLOSED", site.closed || "定休日は準備中です"],
  ["TEL", site.phone || "電話番号は準備中です"],
  ["PARKING", site.parking || "駐車場情報は準備中です"],
] as const;
