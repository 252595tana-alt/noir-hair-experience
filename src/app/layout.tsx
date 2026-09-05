import type { Metadata, Viewport } from "next";
import Experience from "@/components/Experience";
import "./globals.css";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
const displayFont = Barlow_Condensed({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow",
});
const bodyFont = DM_Sans({
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm",
});
import { metadataFor } from "@/lib/seo";
export const metadata: Metadata = metadataFor("/");
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <Experience>{children}</Experience>
      </body>
    </html>
  );
}
