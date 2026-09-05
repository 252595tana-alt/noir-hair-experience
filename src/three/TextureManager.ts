import {
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  LinearFilter,
} from "three";
import { useEffect, useState } from "react";
import { ResourceCache } from "@/lib/resourceCache";
export function useManagedTextures(
  first: string,
  second: string,
  onFailure?: () => void,
) {
  const [cache] = useState(
    () =>
      new ResourceCache<Texture>(
        4,
        async (url) => {
          const texture = await new TextureLoader().loadAsync(url);
          texture.colorSpace = SRGBColorSpace;
          texture.generateMipmaps = false;
          texture.minFilter = LinearFilter;
          return texture;
        },
        (texture) => texture.dispose(),
      ),
  );
  const key = first + "|" + second;
  const [loaded, setLoaded] = useState<{
    key: string;
    textures: Texture[];
  } | null>(null);
  useEffect(() => () => cache.clear(), [cache]);
  useEffect(() => {
    let active = true;
    const urls = [...new Set([first, second])];
    void Promise.all(urls.map((url) => cache.acquire(url)))
      .then((textures) => {
        if (active) {
          const map = new Map(urls.map((url, i) => [url, textures[i]]));
          setLoaded({ key, textures: [map.get(first)!, map.get(second)!] });
        }
      })
      .catch(() => {
        if (active) onFailure?.();
      });
    return () => {
      active = false;
      urls.forEach((url) => cache.release(url));
    };
  }, [first, second, key, onFailure, cache]);
  return loaded?.key === key ? loaded.textures : null;
}
