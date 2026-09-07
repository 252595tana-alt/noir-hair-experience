"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  type ShaderMaterial,
} from "three";
import {
  hairJourneyParticleFragment,
  hairJourneyParticleVertex,
} from "../shaders.generated";

const random = (value: number) => {
  const result = Math.sin(value * 91.719 + 17.31) * 43758.5453;
  return result - Math.floor(result);
};

function createParticleGeometry(count: number) {
  const positions: number[] = [];
  const seeds: number[] = [];
  for (let index = 0; index < count; index += 1) {
    positions.push(0, 0, 0);
    seeds.push(
      random(index + 1.7),
      random(index + 13.1),
      random(index + 29.4),
      random(index + 71.8),
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new Float32BufferAttribute(seeds, 4));
  return geometry;
}

export function HairParticles({
  progressRef,
  count,
  mobile,
}: {
  progressRef: MutableRefObject<number>;
  count: number;
  mobile: boolean;
}) {
  const material = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => createParticleGeometry(count), [count]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCutProgress: { value: 0 },
      uPointSize: { value: mobile ? 1.35 : 1.7 },
      uDpr: { value: 1 },
    }),
    [mobile],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ viewport }, delta) => {
    const values = material.current?.uniforms;
    if (!values) return;
    values.uTime.value += Math.min(delta, 0.05);
    const progress = Math.max(0, Math.min(1, progressRef.current));
    values.uCutProgress.value = Math.min(
      1,
      Math.max(0, (progress - 0.12) / 0.18),
    );
    values.uDpr.value = Math.min(viewport.dpr, mobile ? 1.25 : 1.5);
  });

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={3}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={hairJourneyParticleVertex}
        fragmentShader={hairJourneyParticleFragment}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
