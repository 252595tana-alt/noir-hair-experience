"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { FrontSide, MathUtils, Vector2, type ShaderMaterial, type Texture } from "three";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import {
  hairJourneyThreadsFragment,
  hairJourneyThreadsVertex,
} from "../shaders.generated";
import { createRibbonGeometry } from "../HairLoom/ribbonGeometry";
import type { HairJourneyPointer } from "./CinematicHairCanvas";

const textureDimensions = (texture: Texture) => {
  const image = texture.image as { width?: number; height?: number };
  return new Vector2(image?.width || 768, image?.height || 1024);
};

export function FinalHairThreads({
  progressRef,
  pointerRef,
  texture,
  ribbonCount,
  segmentCount,
  mobile,
}: {
  progressRef: MutableRefObject<number>;
  pointerRef: MutableRefObject<HairJourneyPointer>;
  texture: Texture;
  ribbonCount: number;
  segmentCount: number;
  mobile: boolean;
}) {
  const material = useRef<ShaderMaterial>(null);
  const size = useThree((state) => state.size);
  const tier = usePerformanceTier((state) => state.tier);
  const mouse = useRef(new Vector2());
  const mouseTarget = useRef(new Vector2());
  const geometry = useMemo(
    () => createRibbonGeometry(ribbonCount, segmentCount),
    [ribbonCount, segmentCount],
  );
  const dimensions = useMemo(() => textureDimensions(texture), [texture]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFinalProgress: { value: 0 },
      uTexture: { value: texture },
      uMouse: { value: new Vector2() },
      uFrameScale: { value: new Vector2(0.5, 0.84) },
      uQuality: { value: 1 },
    }),
    [texture],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const values = material.current?.uniforms;
    if (!values) return;
    const safeDelta = Math.min(delta, 0.05);
    values.uTime.value += safeDelta;
    const storyProgress = MathUtils.clamp(progressRef.current, 0, 1);
    values.uFinalProgress.value = MathUtils.smoothstep(
      storyProgress,
      0.84,
      1,
    );
    mouseTarget.current.set(pointerRef.current.x, pointerRef.current.y);
    mouse.current.lerp(mouseTarget.current, Math.min(1, safeDelta * 4));
    values.uMouse.value.copy(mouse.current);
    values.uQuality.value = mobile ? 0.5 : tier === "high" ? 1 : 0.72;

    const imageAspect = dimensions.x / dimensions.y;
    const viewAspect = size.width / Math.max(size.height, 1);
    const height = mobile ? 0.78 : 0.84;
    values.uFrameScale.value.set(
      Math.min(mobile ? 0.9 : 0.72, (height * imageAspect) / viewAspect),
      height,
    );
  });

  return (
    <mesh
      geometry={geometry}
      frustumCulled={false}
      renderOrder={5}
    >
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={hairJourneyThreadsVertex}
        fragmentShader={hairJourneyThreadsFragment}
        transparent
        side={FrontSide}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
