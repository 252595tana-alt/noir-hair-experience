"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { BufferGeometry, Float32BufferAttribute, Color, SRGBColorSpace, Vector4, type ShaderMaterial } from "three";
import { particleVertex, particleFragment } from "../shaders.generated";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";

export type PortraitSamples = { width: number; height: number; points: number[] };
export type FormationClock = { elapsed: number };
export function portraitGeometry(data: PortraitSamples, count: number) {
  const target = new Float32Array(count * 3), scattered = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const color = new Color();
  let seed = 73;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const j = i * 5;
    target.set([data.points[j], data.points[j + 1], random()], i * 3);
    const angle = random() * Math.PI * 2, radius = .3 + random() * 1.5;
    scattered.set([Math.cos(angle) * radius, Math.sin(angle) * radius, random()], i * 3);
    color.setRGB(data.points[j + 2], data.points[j + 3], data.points[j + 4], SRGBColorSpace);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(scattered, 3));
  geometry.setAttribute("randomPosition", new Float32BufferAttribute(scattered, 3));
  geometry.setAttribute("targetPosition", new Float32BufferAttribute(target, 3));
  geometry.setAttribute("sampleColor", new Float32BufferAttribute(colors, 3));
  return geometry;
}

export function ParticleHead({ portrait, clock, onReady }: {
  portrait: PortraitSamples;
  clock: RefObject<FormationClock>;
  onReady: () => void;
}) {
  const tier = usePerformanceTier(s => s.tier), mobile = usePerformanceTier(s => s.mobile);
  const count = Math.min(portrait.points.length / 5, mobile ? (tier === "low" ? 400 : 700) : tier === "high" ? 6000 : tier === "medium" ? 3000 : 1000);
  const degradation = usePerformanceTier(s => s.degradation);
  const geometry = useMemo(() => portraitGeometry(portrait, count), [portrait, count]);
  const material = useRef<ShaderMaterial>(null), ready = useRef(false);
  const gl = useThree(s => s.gl);
  const fit = useRef({ rect: new Vector4(0, 0, 1, 1), dpr: 1 });
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uProgress: { value: 0 }, uOpacity: { value: 0 },
    uDpr: { value: 1 }, uPointSize: { value: mobile ? 5.2 : 3.6 },
    uImageRect: { value: new Vector4(0, 0, 1, 1) },
  }), [mobile]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const photo = document.querySelector<HTMLImageElement>("[data-hero-photo] img");
    if (!photo) return;
    const align = () => {

      const box = photo.getBoundingClientRect(), canvas = gl.domElement.getBoundingClientRect();
      if (!canvas.width || !canvas.height) return;
      const css = getComputedStyle(photo);
      const scale = css.objectFit === "cover" ? Math.max(box.width / portrait.width, box.height / portrait.height) : Math.min(box.width / portrait.width, box.height / portrait.height);
      const width = portrait.width * scale, height = portrait.height * scale;
      const position = css.objectPosition.split(" ");
      const fraction = (part: string | undefined, fallback: number) => part?.endsWith("%") ? parseFloat(part) / 100 : part === "top" || part === "left" ? 0 : part === "bottom" || part === "right" ? 1 : fallback;
      fit.current.rect.set(
        (box.left - canvas.left + (box.width - width) * fraction(position[0], .5)) / canvas.width,
        (box.top - canvas.top + (box.height - height) * fraction(position[1], 0)) / canvas.height,
        width / canvas.width, height / canvas.height,
      );
      fit.current.dpr = gl.getPixelRatio();
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(photo); observer.observe(gl.domElement);
    window.addEventListener("resize", align);
    return () => { observer.disconnect(); window.removeEventListener("resize", align); };
  }, [gl, portrait]);
  useFrame(() => {
    const current = material.current?.uniforms;
    if (!current) return;
    if (!ready.current) { ready.current = true; onReady(); }
    const visibleCount = Math.round(count * (degradation ? .65 : 1));
    geometry.setDrawRange(0, visibleCount);
    gl.domElement.setAttribute("data-particles", String(visibleCount));
    current.uImageRect.value.copy(fit.current.rect);
    current.uDpr.value = fit.current.dpr;
    const t = clock.current.elapsed;
    current.uTime.value = t;
    current.uProgress.value = Math.min(1, Math.max(0, (t - .3) / 1.6));
    current.uOpacity.value = Math.min(1, t / .25) * (1 - Math.min(1, Math.max(0, (t - 2.6) / .85)));
  });
  return <points geometry={geometry} frustumCulled={false}>
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={particleVertex} fragmentShader={particleFragment} transparent depthWrite={false} depthTest={false} />
  </points>;
}
