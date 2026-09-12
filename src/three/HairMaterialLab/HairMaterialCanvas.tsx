"use client";

import { Component, useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color, DoubleSide, Vector2, type ShaderMaterial } from "three";
import { hairMaterialVertex, hairMaterialFragment } from "../shaders.generated";
import { createHairMaterialGeometry } from "./hairMaterialGeometry";
import { materialPalette, textureProfiles, type HairMaterialSelection } from "@/components/HairMaterialLab/model";

export type MaterialLight = { x: number; y: number };
type Props = {
  selection: HairMaterialSelection;
  compact: boolean;
  active: boolean;
  reducedMotion: boolean;
  sweep: boolean;
  light: RefObject<MaterialLight>;
  onWakeChange: (wake: () => void) => void;
  onReady: () => void;
  onFailure: () => void;
};

class MaterialBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function HairMaterialScene({ selection, compact, active, reducedMotion, sweep, light, onReady, onFailure, onWakeChange }: Props) {
  const { gl, invalidate, viewport } = useThree();
  const material = useRef<ShaderMaterial>(null);
  const firstFrame = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameCount = useRef(0);
  const geometry = useMemo(() => createHairMaterialGeometry(compact ? 42 : 72, compact ? 64 : 112), [compact]);
  const targetColor = useMemo(() => new Color(materialPalette[selection.color]), [selection.color]);
  const uniforms = useMemo(() => ({
    uWave: { value: 0 },
    uColor: { value: new Color(materialPalette.brown) },
    uRoughness: { value: textureProfiles.natural.roughness as number },
    uSpecular: { value: textureProfiles.natural.specular as number },
    uHighlight: { value: textureProfiles.natural.highlight as number },
    uLight: { value: new Vector2(0, 0) },
    uSweep: { value: 0 },
  }), []);
  const defines = useMemo(() => ({ NOISE_OCTAVES: compact ? 1 : 3 }), [compact]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useEffect(() => {
    onWakeChange(active ? invalidate : () => {});
    if (active) invalidate();
    return () => {
      onWakeChange(() => {});
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [active, invalidate, onWakeChange]);
  useEffect(() => {
    if (active) invalidate();
  }, [active, selection, sweep, reducedMotion, invalidate]);

  useFrame((_, delta) => {
    if (!active || !material.current) return;
    const u = material.current.uniforms;
    const profile = textureProfiles[selection.texture];
    const blend = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.06) * 7);
    let moving = false;
    for (const [key, target] of Object.entries({
      uWave: selection.style === "wave" ? 1 : 0,
      uRoughness: profile.roughness, uSpecular: profile.specular, uHighlight: profile.highlight,
    })) {
      const distance = target - u[key].value;
      u[key].value = Math.abs(distance) < 0.0005 ? target : u[key].value + distance * blend;
      moving ||= Math.abs(distance) > 0.0005;
    }
    const color = u.uColor.value as Color;
    moving ||= Math.abs(color.r - targetColor.r) + Math.abs(color.g - targetColor.g) + Math.abs(color.b - targetColor.b) > 0.001;
    color.lerp(targetColor, blend);
    const illumination = u.uLight.value as Vector2;
    moving ||= Math.abs(illumination.x - light.current.x) + Math.abs(illumination.y - light.current.y) > 0.001;
    illumination.x += (light.current.x - illumination.x) * blend;
    illumination.y += (light.current.y - illumination.y) * blend;
    if (sweep && !reducedMotion) u.uSweep.value += Math.min(delta, 0.06) * 0.38;
    frameCount.current++;
    const canvas = gl.domElement;
    // Inspectable renderer state for integration diagnostics and browser QA.
    canvas.setAttribute("data-frames", String(frameCount.current));
    canvas.setAttribute("data-roughness", u.uRoughness.value.toFixed(4));
    canvas.setAttribute("data-specular", u.uSpecular.value.toFixed(4));
    canvas.setAttribute("data-highlight", u.uHighlight.value.toFixed(4));
    canvas.setAttribute("data-wave", u.uWave.value.toFixed(4));
    canvas.setAttribute("data-light", `${illumination.x.toFixed(3)},${illumination.y.toFixed(3)}`);
    if ((moving || (sweep && !reducedMotion)) && timer.current === null) {
      timer.current = setTimeout(() => { timer.current = null; invalidate(); }, compact ? 1000 / 30 : 0);
    }
  });

  const scale = Math.min(viewport.width / 3.05, viewport.height / 4.25);
  return (
    <mesh geometry={geometry} scale={scale} frustumCulled={false} onAfterRender={() => {
      if (!firstFrame.current) { firstFrame.current = true; queueMicrotask(onReady); }
    }}>
      <shaderMaterial ref={material} uniforms={uniforms} defines={defines}
        vertexShader={hairMaterialVertex} fragmentShader={hairMaterialFragment}
        transparent side={DoubleSide} depthWrite={false} />
    </mesh>
  );
}

export default function HairMaterialCanvas(props: Props) {
  return (
    <div style={{ position: "absolute", inset: 0 }} data-testid="hair-material-canvas"
      data-noise-octaves={props.compact ? 1 : 3} data-dpr-cap={props.compact ? 1 : 1.5}
      data-rendering={props.active ? "active" : "paused"} aria-hidden="true">
      <MaterialBoundary onFailure={props.onFailure}>
        <Canvas orthographic camera={{ position: [0, 0, 6], zoom: 100, near: 0.1, far: 20 }}
          frameloop={props.active ? "demand" : "never"} dpr={[1, props.compact ? 1 : 1.5]}
          gl={{ alpha: true, antialias: !props.compact, powerPreference: "low-power" }}
          fallback={null}
          onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.debug.onShaderError = props.onFailure; }}>
          <HairMaterialScene {...props} />
        </Canvas>
      </MaterialBoundary>
    </div>
  );
}
