import {
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  LinearFilter,
} from "three";
import { useEffect, useRef, useState } from "react";
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

/**
 * Keeps the last valid pair alive until the next pair has loaded completely.
 * This prevents a blank frame while an unwoven transition is being queued.
 */
export function useTransitionTextures(
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
  const requestedKey = first + "|" + second;
  const lease = useRef<string[]>([]);
  const generation = useRef(0);
  const [loaded, setLoaded] = useState<{
    key: string;
    textures: [Texture, Texture];
  } | null>(null);

  useEffect(() => {
    const token = ++generation.current;
    const urls = [...new Set([first, second])];
    void Promise.all(urls.map((url) => cache.acquire(url)))
      .then((textures) => {
        if (token !== generation.current) {
          urls.forEach((url) => cache.release(url));
          return;
        }
        const byUrl = new Map(urls.map((url, index) => [url, textures[index]]));
        const previousLease = lease.current;
        lease.current = urls;
        setLoaded({
          key: requestedKey,
          textures: [byUrl.get(first)!, byUrl.get(second)!],
        });
        previousLease.forEach((url) => cache.release(url));
      })
      .catch(() => {
        urls.forEach((url) => cache.release(url));
        if (token === generation.current) onFailure?.();
      });
  }, [first, second, requestedKey, cache, onFailure]);

  useEffect(
    () => () => {
      generation.current += 1;
      lease.current.forEach((url) => cache.release(url));
      lease.current = [];
      cache.clear();
    },
    [cache],
  );

  return {
    textures: loaded?.textures ?? null,
    requestedReady: loaded?.key === requestedKey,
  };
}
