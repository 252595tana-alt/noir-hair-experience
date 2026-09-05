"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import { Vector2, type ShaderMaterial } from "three";
import { useManagedTextures } from "../TextureManager";
import { lensFragment, noise, planeVertex, utils } from "../shaders.generated";
import {
  usePerformanceTier,
  qualityProfiles,
} from "@/hooks/usePerformanceTier";
export function HairLens({
  current,
  candidate,
  pointer,
  applying,
  onFailure,
}: {
  current: string;
  candidate: string;
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
  const uniforms = useMemo(
    () => ({
      uCurrentTexture: { value: null },
      uTryTexture: { value: null },
      uMouse: { value: new Vector2(0.5, 0.55) },
      uResolution: { value: new Vector2() },
      uImageSize: { value: new Vector2(600, 800) },
      uRadius: { value: 0.2 },
      uQuality: { value: 1 },
      uSweep: { value: 0 },
    }),
    [],
  );
  useFrame((_, delta) => {
    const uniforms = material.current?.uniforms;
    if (!uniforms) return;
    uniforms.uMouse.value.x +=
      (pointer.current.x - uniforms.uMouse.value.x) * 0.08;
    uniforms.uMouse.value.y +=
      (pointer.current.y - uniforms.uMouse.value.y) * 0.08;
    if (applying)
      progress.current = Math.min(
        1,
        progress.current + Math.min(delta, 0.05) / 0.8,
      );
    else progress.current = 0;
    uniforms.uRadius.value = 0.2 + progress.current * 1.8;
    uniforms.uSweep.value = progress.current;
    if (
      (applying && progress.current < 1) ||
      Math.abs(pointer.current.x - uniforms.uMouse.value.x) +
        Math.abs(pointer.current.y - uniforms.uMouse.value.y) >
        0.001
    )
      invalidate();
  });
  if (!textures) return null;
  const resolved = {
    ...uniforms,
    uCurrentTexture: { value: textures[0] },
    uTryTexture: { value: textures[1] },
  };
  resolved.uResolution.value.set(size.width, size.height);
  const image = textures[0].image as HTMLImageElement;
  resolved.uImageSize.value.set(image.width, image.height);
  resolved.uQuality.value = qualityProfiles[tier].noise;
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
