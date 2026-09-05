"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Color,
  Vector2,
  type ShaderMaterial,
} from "three";
import { useEffect } from "react";
import { particleVertex, particleFragment } from "../shaders.generated";
import {
  qualityProfiles,
  usePerformanceTier,
} from "@/hooks/usePerformanceTier";
import { useSiteStore } from "@/store/useSiteStore";
import type { HairColor } from "@/data/hairStyles";
const colors: Record<HairColor, string> = {
  black: "#b9cbd9",
  ash: "#acb7c1",
  silver: "#c7ddea",
  blonde: "#e1d9bd",
  "dark-brown": "#b9a38f",
  beige: "#cec1ac",
  red: "#ac6868",
  pink: "#d6acbb",
};
/** Replace this sampler with GLB surface samples in Phase 4; shader attributes stay unchanged. */
export function sampleHead(count: number) {
  const random = new Float32Array(count * 3),
    target = new Float32Array(count * 3),
    hair = new Float32Array(count * 3);
  let seed = 73;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2,
      z = rand() * 2 - 1,
      ring = Math.sqrt(1 - z * z);
    const x = Math.cos(a) * ring * 0.33,
      y = z * 0.49 + 0.2;
    const flow = rand();
    random.set([(rand() - 0.5) * 2, (rand() - 0.5) * 2, rand()], i * 3);
    target.set([x, y, Math.sin(a) * ring], i * 3);
    hair.set(
      [
        Math.sign(x) * (0.26 + Math.abs(x) * 0.4) + Math.sin(flow * 12) * 0.025,
        0.65 - flow * 1.4,
        rand(),
      ],
      i * 3,
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(random, 3));
  geometry.setAttribute(
    "randomPosition",
    new Float32BufferAttribute(random, 3),
  );
  geometry.setAttribute(
    "targetPosition",
    new Float32BufferAttribute(target, 3),
  );
  geometry.setAttribute("hairPosition", new Float32BufferAttribute(hair, 3));
  return geometry;
}
export function ParticleHead({
  opening = false,
  startedAt = 0,
}: {
  opening?: boolean;
  startedAt?: number;
}) {
  const tier = usePerformanceTier((s) => s.tier),
    degradation = usePerformanceTier((s) => s.degradation);
  const color = useSiteStore((s) => s.selectedColor);
  const mobile = usePerformanceTier((s) => s.mobile);
  const count = opening
    ? Math.min(qualityProfiles[tier].particles, mobile ? 600 : 2000)
    : Math.round(qualityProfiles[tier].particles * 0.08);
  const geometry = useMemo(() => sampleHead(count), [count]);
  const material = useRef<ShaderMaterial>(null);
  const pointer = useRef({ x: -10, y: -10 });
  const gl = useThree((s) => s.gl);
  const uniforms = useMemo(
    () => ({
      uProgress: { value: opening ? 0 : 1 },
      uHair: { value: opening ? 0 : 1 },
      uTime: { value: 0 },
      uDpr: { value: qualityProfiles[tier].dpr },
      uColor: { value: new Color(colors[color]) },
      uOpacity: { value: opening ? 0 : 0.25 },
      uAmbient: { value: opening ? 0 : 1 },
      uPointer: { value: new Vector2(-10, -10) },
    }),
    [opening, tier, color],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    if (opening || !matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.current.x = (event.clientX - rect.left) / rect.width;
      pointer.current.y = 1 - (event.clientY - rect.top) / rect.height;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [gl, opening]);
  useFrame((_, delta) => {
    const uniforms = material.current?.uniforms;
    if (!uniforms) return;
    uniforms.uPointer.value.set(pointer.current.x, pointer.current.y);
    uniforms.uTime.value += Math.min(delta, 0.05);
    const t = opening
      ? (performance.now() - startedAt) / 1000
      : uniforms.uTime.value;
    if (opening) {
      uniforms.uProgress.value = Math.min(1, Math.max(0, (t - 0.8) / 1));
      uniforms.uHair.value = Math.min(1, Math.max(0, (t - 1.8) / 0.7));
      uniforms.uOpacity.value = Math.min(1, Math.max(0, (t - 0.3) * 2));
    }
    geometry.setDrawRange(0, Math.round(count * (degradation ? 0.65 : 1)));
  });
  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </points>
  );
}
