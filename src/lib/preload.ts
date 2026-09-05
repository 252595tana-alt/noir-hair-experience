const loaded = new Set<string>();
import { reducedData } from "@/hooks/useReducedData";
export function preloadImages(urls: string[]) {
  if (typeof window === "undefined" || reducedData()) return;
  urls.forEach((src) => {
    if (loaded.has(src)) return;
    loaded.add(src);
    if (loaded.size > 32) loaded.delete(loaded.values().next().value!);
    const image = new window.Image();
    image.src = src;
    image.onerror = () => loaded.delete(src);
  });
}
