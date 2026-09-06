"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import { Color, Vector2, type ShaderMaterial, type Texture } from "three";
import { useManagedTextures } from "../TextureManager";
import { lensFragment, noise, planeVertex, utils } from "../shaders.generated";
import {
  usePerformanceTier,
  qualityProfiles,
} from "@/hooks/usePerformanceTier";
export function HairLens({
  current,
  candidate,
  accent,
  pointer,
  applying,
  onFailure,
}: {
  current: string;
  candidate: string;
  accent: string;
  pointer: MutableRefObject<{ x: number; y: number }>;
  applying: boolean;
  onFailure: () => void;
}) {
  const textures = useManagedTextures(current, candidate, onFailure);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const tier = usePerformanceTier((s) => s.tier);
  const progress = useRef(0);
  const material = useRef<ShaderMaterial>(null);
  const accentColor = useMemo(() => new Color(accent), [accent]);
  const uniforms = useMemo(
    () => ({
      uCurrentTexture: { value: null as Texture | null },
      uTryTexture: { value: null as Texture | null },
      uMouse: { value: new Vector2(0.5, 0.55) },
      uResolution: { value: new Vector2() },
      uCurrentSize: { value: new Vector2(600, 800) },
      uTrySize: { value: new Vector2(600, 800) },
      uRadius: { value: 0.19 },
      uQuality: { value: 1 },
      uProgress: { value: 0 },
      uApplying: { value: 0 },
      uAccent: { value: new Color("#d8d8d4") },
    }),
    [],
  );
  useFrame((_, delta) => {
    const live = material.current?.uniforms;
    if (!live) return;
    const safeDelta = Math.min(delta, 0.05);
    const follow = 1 - Math.exp(-safeDelta * 5);
    live.uMouse.value.x += (pointer.current.x - live.uMouse.value.x) * follow;
    live.uMouse.value.y += (pointer.current.y - live.uMouse.value.y) * follow;
    if (applying)
      progress.current = Math.min(
        1,
        progress.current + safeDelta / 0.85,
      );
    else progress.current = 0;
    live.uProgress.value = progress.current;
    live.uApplying.value = applying ? 1 : 0;
    if (
      (applying && progress.current < 1) ||
      Math.abs(pointer.current.x - live.uMouse.value.x) +
        Math.abs(pointer.current.y - live.uMouse.value.y) >
        0.001
    )
      invalidate();
  });
  if (!textures) return null;
  const dimensions = (texture: Texture) => {
    const image = texture.image as {
      width?: number;
      height?: number;
      naturalWidth?: number;
      naturalHeight?: number;
    };
    return {
      width: image.naturalWidth || image.width || 600,
      height: image.naturalHeight || image.height || 800,
    };
  };
  const currentSize = dimensions(textures[0]);
  const trySize = dimensions(textures[1]);
  const resolved = {
    ...uniforms,
    uCurrentTexture: { value: textures[0] },
    uTryTexture: { value: textures[1] },
    uQuality: { value: qualityProfiles[tier].noise },
    uAccent: { value: accentColor },
  };
  resolved.uResolution.value.set(size.width, size.height);
  resolved.uCurrentSize.value.set(currentSize.width, currentSize.height);
  resolved.uTrySize.value.set(trySize.width, trySize.height);
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        uniforms={resolved}
        vertexShader={planeVertex}
        fragmentShader={noise + utils + lensFragment}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
