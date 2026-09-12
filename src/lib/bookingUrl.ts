import { safeHttps } from "@/config/site";
import type { HairMaterialSelection } from "@/components/HairMaterialLab/model";
import type { DepthPortraitSelection } from "@/components/DepthHairPortrait/model";
export function createPortraitWebBookingUrl(base: string | undefined, selection: DepthPortraitSelection): string | undefined {
  const safe = safeHttps(base);
  if (!safe) return undefined;
  const url = new URL(safe);
  url.searchParams.set("source", "depth-hair-portrait");
  for (const [key, value] of Object.entries(selection)) url.searchParams.set(key, value);
  return url.href;
}
export function createMaterialWebBookingUrl(base: string | undefined, selection: HairMaterialSelection): string | undefined {
  const safe = safeHttps(base);
  if (!safe) return undefined;
  const url = new URL(safe);
  url.searchParams.set("source", "hair-material-lab");
  for (const [key, value] of Object.entries(selection)) url.searchParams.set(key, value);
  return url.href;
}
/** LINE official-account URL: https://line.me/R/oaMessage/@account/?<encoded message> */
export function createLineBookingUrl(
  base: string | undefined,
  message: string,
): string | undefined {
  const safe = safeHttps(base);
  if (!safe) return undefined;
  const url = new URL(safe);
  if (url.hostname === "line.me" && url.pathname.startsWith("/R/oaMessage/")) {
    try {
      const id = decodeURIComponent(url.pathname.split("/")[3]);
      if (!id) return undefined;
      return `${url.origin}/R/oaMessage/${encodeURIComponent(id)}/?${encodeURIComponent(message)}`;
    } catch {
      return undefined;
    }
  }
  // Generic reservation endpoints can consume the documented text query parameter.
  url.searchParams.set("text", message);
  return url.href;
}
