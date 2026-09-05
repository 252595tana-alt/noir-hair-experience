import { notFound } from "next/navigation";
import { styles } from "@/data/styles";
import { stylists } from "@/data/stylists";
import { metadataFor } from "@/lib/seo";
import { ServerContent } from "@/components/ServerContent";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  return metadataFor("/" + path.join("/"));
}
const allowed = [
  "",
  "concept",
  "style",
  "color",
  "stylist",
  "menu",
  "booking",
  "salon",
  ...styles.map((style) => `style/${style.slug}`),
  ...stylists.map((person) => `stylist/${person.slug}`),
];
export function generateStaticParams() {
  return allowed.map((path) => ({ path: path ? path.split("/") : [] }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  if (!allowed.includes(path.join("/"))) notFound();
  return <ServerContent path={"/" + path.join("/")} />;
}
