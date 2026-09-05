import { safeHttps } from "@/config/site";
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
