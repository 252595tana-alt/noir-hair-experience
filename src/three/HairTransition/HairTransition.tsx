"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Vector2, type ShaderMaterial } from "three";
import { useManagedTextures } from "../TextureManager";
import {
  noise,
  utils,
  planeVertex,
  transitionFragment,
} from "../shaders.generated";
import {
  qualityProfiles,
  usePerformanceTier,
} from "@/hooks/usePerformanceTier";
export function HairTransition({
  from,
  to,
  direction,
}: {
  from: string;
  to: string;
  direction: number;
}) {
  const textures = useManagedTextures(from, to);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const tier = usePerformanceTier((s) => s.tier);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTexture1: { value: null },
      uTexture2: { value: null },
      uSize1: { value: new Vector2(600, 800) },
      uSize2: { value: new Vector2(600, 800) },
      uResolution: { value: new Vector2() },
      uProgress: { value: 0 },
      uDirection: { value: direction },
      uQuality: { value: 1 },
      uFocus: { value: 0.5 },
    }),
    [direction],
  );
  useFrame((_, delta) => {
    const uniforms = material.current?.uniforms;
    if (uniforms && textures)
      uniforms.uProgress.value = Math.min(
        1,
        uniforms.uProgress.value + Math.min(delta, 0.05) / 0.75,
      );
    if (uniforms && textures && uniforms.uProgress.value < 1) invalidate();
  });
  if (!textures) return null;
  uniforms.uResolution.value.set(size.width, size.height);
  const firstImage = textures[0].image as HTMLImageElement,
    secondImage = textures[1].image as HTMLImageElement;
  uniforms.uSize1.value.set(firstImage.width, firstImage.height);
  uniforms.uSize2.value.set(secondImage.width, secondImage.height);
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        uniforms={{
          ...uniforms,
          uQuality: { value: qualityProfiles[tier].noise },
          uFocus: { value: size.width < 450 ? 0.68 : 0.5 },
          uTexture1: { value: textures[0] },
          uTexture2: { value: textures[1] },
        }}
        vertexShader={planeVertex}
        fragmentShader={noise + utils + transitionFragment}
        toneMapped={false}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
