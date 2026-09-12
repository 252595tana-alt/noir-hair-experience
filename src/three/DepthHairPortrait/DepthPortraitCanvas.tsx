"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Color, LinearFilter, NoColorSpace, PlaneGeometry, SRGBColorSpace, TextureLoader, Vector2, type ShaderMaterial, type Texture } from "three";
import { depthPortraitVertex, depthPortraitFragment } from "../shaders.generated";
import { depthPortraits, portraitQuality, portraitTones, type DepthPortraitSelection } from "@/components/DepthHairPortrait/model";

export type PortraitPointer = { x: number; y: number };
export type DepthCanvasProps = {
  selection: DepthPortraitSelection;
  compact: boolean;
  active: boolean;
  motion: boolean;
  original: boolean;
  reducedMotion: boolean;
  pointer: RefObject<PortraitPointer>;
  onWakeChange: (wake: () => void) => void;
  onReady: () => void;
  onFailure: () => void;
};
type PortraitTextures = { photo: Texture; depth: Texture; mask: Texture };

function usePortraitTextures(style: DepthPortraitSelection["style"], compact: boolean, onFailure: () => void) {
  const [textures, setTextures] = useState<PortraitTextures | null>(null);
  useEffect(() => {
    const asset = depthPortraits[style];
    const paths = compact ? [asset.mobilePhoto, asset.mobileDepth, asset.mobileMask] : [asset.photo, asset.depth, asset.mask];
    const owned = new Set<Texture>();
    let alive = true;
    const loader = new TextureLoader();
    void Promise.all(paths.map(async (path, index) => {
      const texture = await loader.loadAsync(path);
      if (!alive) { texture.dispose(); return texture; }
      owned.add(texture);
      texture.colorSpace = index === 0 ? SRGBColorSpace : NoColorSpace;
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.generateMipmaps = false;
      return texture;
    })).then(([photo, depth, mask]) => {
      if (alive) setTextures({ photo, depth, mask });
    }).catch(() => {
      if (alive) { alive = false; owned.forEach((texture) => texture.dispose()); onFailure(); }
    });
    return () => { alive = false; owned.forEach((texture) => texture.dispose()); owned.clear(); };
  }, [style, compact, onFailure]);
  return textures;
}

class PortraitBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Scene(props: DepthCanvasProps) {
  const textures = usePortraitTextures(props.selection.style, props.compact, props.onFailure);
  return textures ? <PortraitPlane {...props} textures={textures} /> : null;
}

function PortraitPlane({ textures, selection, compact, active, motion, original, reducedMotion, pointer, onWakeChange, onReady, onFailure }: DepthCanvasProps & { textures: PortraitTextures }) {
  const { gl, invalidate, viewport } = useThree();
  const material = useRef<ShaderMaterial>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRendered = useRef(false);
  const frames = useRef(0);
  const quality = portraitQuality[compact ? "mobile" : "desktop"];
  const geometry = useMemo(() => new PlaneGeometry(2, 3, ...quality.segments), [quality]);
  const tone = portraitTones[selection.color];
  const tint = useMemo(() => new Color(tone.tint), [tone.tint]);
  const uniforms = useMemo(() => ({
    uPhoto: { value: textures.photo }, uDepth: { value: textures.depth }, uHairMask: { value: textures.mask },
    uTint: { value: new Color(portraitTones.beige.tint) }, uExposure: { value: portraitTones.beige.exposure as number },
    uPointer: { value: new Vector2() }, uPointerStrength: { value: 0 },
    uTime: { value: 0 }, uOriginal: { value: 0 },
    uTexel: { value: new Vector2(1 / (compact ? 640 : 1024), 1 / (compact ? 960 : 1536)) },
  }), [textures, compact]);
  const defines = useMemo(() => ({ NOISE_OCTAVES: quality.noiseOctaves, PORTRAIT_HIGH_QUALITY: compact ? 0 : 1 }), [quality, compact]);
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
  useEffect(() => { if (active) invalidate(); }, [selection, motion, original, reducedMotion, active, invalidate]);

  useFrame((_, delta) => {
    if (!active || !material.current) return;
    const u = material.current.uniforms;
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.06) * 8);
    const animate = motion && !reducedMotion && !original;
    let settling = false;
    for (const [key, target] of Object.entries({ uExposure: tone.exposure, uOriginal: original ? 1 : 0, uPointerStrength: animate ? quality.pointerStrength : 0 })) {
      const gap = target - u[key].value;
      u[key].value = Math.abs(gap) < 0.001 ? target : u[key].value + gap * alpha;
      settling ||= Math.abs(gap) >= 0.001;
    }
    const currentTint = u.uTint.value as Color;
    const colorGap = Math.abs(currentTint.r - tint.r) + Math.abs(currentTint.g - tint.g) + Math.abs(currentTint.b - tint.b);
    settling ||= colorGap > 0.001;
    if (colorGap < 0.001) currentTint.copy(tint); else currentTint.lerp(tint, alpha);
    const position = u.uPointer.value as Vector2;
    const x = animate ? Math.max(-1, Math.min(1, pointer.current.x)) : 0;
    const y = animate ? Math.max(-1, Math.min(1, pointer.current.y)) : 0;
    settling ||= Math.abs(position.x - x) + Math.abs(position.y - y) > 0.001;
    position.x += (x - position.x) * alpha;
    position.y += (y - position.y) * alpha;
    if (animate) u.uTime.value += Math.min(delta, 0.06);
    const canvas = gl.domElement;
    canvas.setAttribute("data-frames", String(++frames.current));
    canvas.setAttribute("data-pointer", `${position.x.toFixed(3)},${position.y.toFixed(3)}`);
    canvas.setAttribute("data-strength", u.uPointerStrength.value.toFixed(3));
    canvas.setAttribute("data-exposure", u.uExposure.value.toFixed(3));
    canvas.setAttribute("data-original", u.uOriginal.value.toFixed(3));
    canvas.setAttribute("data-textures", String(gl.info.memory.textures));
    if ((animate || settling) && timer.current === null) {
      timer.current = setTimeout(() => { timer.current = null; invalidate(); }, compact ? 1000 / 30 : 0);
    }
  });
  const scale = Math.min(viewport.width / 2, viewport.height / 3);
  return <mesh geometry={geometry} scale={scale} frustumCulled={false} onAfterRender={() => {
    if (!hasRendered.current) { hasRendered.current = true; queueMicrotask(onReady); }
  }}>
    <shaderMaterial ref={material} uniforms={uniforms} defines={defines} vertexShader={depthPortraitVertex}
      fragmentShader={depthPortraitFragment} toneMapped={false} />
  </mesh>;
}

export default function DepthPortraitCanvas(props: DepthCanvasProps) {
  const quality = portraitQuality[props.compact ? "mobile" : "desktop"];
  return <div style={{ position: "absolute", inset: 0 }} aria-hidden="true" data-testid="depth-portrait-canvas"
    data-segments={quality.segments.join("x")} data-dpr-cap={quality.dpr} data-noise-octaves={quality.noiseOctaves}
    data-rendering={props.active ? "active" : "paused"}>
    <PortraitBoundary onFailure={props.onFailure}>
      <Canvas orthographic camera={{ position: [0, 0, 5], zoom: 100, near: 0.1, far: 10 }}
        frameloop={props.active ? "demand" : "never"} dpr={[1, quality.dpr]} fallback={null}
        gl={{ alpha: false, antialias: !props.compact, powerPreference: "low-power" }}
        onCreated={({ gl }) => { gl.setClearColor(0x050505, 1); gl.debug.onShaderError = props.onFailure; }}>
        <Scene {...props} />
      </Canvas>
    </PortraitBoundary>
  </div>;
}
