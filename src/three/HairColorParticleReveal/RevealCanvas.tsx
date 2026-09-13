"use client";

import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { LinearFilter, NoColorSpace, SRGBColorSpace, TextureLoader, WebGPURenderer, type Texture } from "three/webgpu";
import { revealQuality, revealStyles, type RevealSelection } from "@/components/HairColorParticleReveal/model";
import { createRevealNodes, type RevealAssets } from "./revealNodes";

export type RevealPointer = { x: number; y: number };
export type RevealCanvasProps = {
  selection: RevealSelection; compact: boolean; active: boolean; motion: boolean; replay: number;
  pointer: RefObject<RevealPointer>; onReady: (engine: "webgpu" | "webgl") => void; onFailure: () => void;
};
class RevealBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function useAssets(style: RevealSelection["style"], compact: boolean, onFailure: () => void) {
  const [assets, setAssets] = useState<RevealAssets | null>(null);
  useEffect(() => {
    const asset = revealStyles[style], owned = new Set<Texture>(), controller = new AbortController();
    let alive = true;
    const loader = new TextureLoader();
    const paths = compact ? [asset.mobilePhoto, asset.mobileMask, asset.mobileFlow] : [asset.photo, asset.mask, asset.flow];
    const textures = Promise.all(paths.map(async (path, index) => {
      const t = await loader.loadAsync(path);
      if (!alive) { t.dispose(); return t; }
      owned.add(t); t.colorSpace = index === 0 ? SRGBColorSpace : NoColorSpace;
      t.minFilter = LinearFilter; t.magFilter = LinearFilter; t.generateMipmaps = false;
      return t;
    }));
    const seeds = fetch(compact ? asset.mobileSeeds : asset.seeds, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Missing hair emission data");
      const buffer = await response.arrayBuffer();
      const expected = revealQuality[compact ? "mobile" : "desktop"].count * 4 * 4;
      if (buffer.byteLength !== expected) throw new Error("Invalid hair emission data");
      return new Float32Array(buffer);
    });
    void Promise.all([textures, seeds]).then(([[photo, mask, flow], seeds]) => {
      if (alive) setAssets({ photo, mask, flow, seeds });
    }).catch(() => { if (alive) { alive = false; owned.forEach((t) => t.dispose()); onFailure(); } });
    return () => { alive = false; controller.abort(); owned.forEach((t) => t.dispose()); };
  }, [style, compact, onFailure]);
  return assets;
}

function watchRenderer(renderer: WebGPURenderer, onFailure: () => void) {
  const lost = (event: Event) => { event.preventDefault(); onFailure(); };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  renderer.onDeviceLost = onFailure;
  renderer.debug.onShaderError = onFailure;
  const device = (renderer.backend as { device?: EventTarget }).device;
  device?.addEventListener("uncapturederror", lost);
  return () => {
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    device?.removeEventListener("uncapturederror", lost);
    renderer.onDeviceLost = () => {};
    renderer.debug.onShaderError = null;
  };
}

function Scene({ assets, ...props }: RevealCanvasProps & { assets: RevealAssets }) {
  const { gl, invalidate, viewport } = useThree();
  const renderer = gl as unknown as WebGPURenderer;
  const gpu = Boolean((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend);
  const quality = revealQuality[props.compact ? "mobile" : "desktop"];
  const { onFailure } = props;
  const [initialColor] = useState(props.selection.color);
  const system = useMemo(() => createRevealNodes(assets, props.compact, gpu, initialColor), [assets, props.compact, gpu, initialColor]);
  const lastColor = useRef(initialColor), lastReplay = useRef(props.replay);
  const frames = useRef(0), dispatches = useRef(0), ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => system.dispose(), [system]);
  useEffect(() => {
    if (lastColor.current !== props.selection.color || lastReplay.current !== props.replay) {
      system.transition(props.selection.color);
      lastColor.current = props.selection.color; lastReplay.current = props.replay;
    }
    system.setMotion(props.motion);
    if (props.active) invalidate();
  }, [system, props.selection.color, props.replay, props.motion, props.active, invalidate]);
  useEffect(() => watchRenderer(renderer, onFailure), [renderer, onFailure]);
  useEffect(() => {
    if (props.active) invalidate();
    return () => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; };
  }, [props.active, invalidate]);
  useFrame((state, delta) => {
    if (!props.active) return;
    const u = system.uniforms;
    const dt = Math.min(delta, .05);
    const { animating, needsCompute } = system.advance(dt, props.motion, props.pointer.current);
    try {
      // No getArrayBuffer / readback, setXYZ, buffer mutation or particle loops.
      if (system.compute && needsCompute) {
        renderer.compute(system.compute); dispatches.current++;
      }
      system.didCompute();
      system.group.scale.setScalar(Math.min(viewport.width / 2, viewport.height / 3));
      renderer.render(state.scene, state.camera);
      const canvas = renderer.domElement;
      canvas.setAttribute("data-frames", String(++frames.current));
      canvas.setAttribute("data-dispatches", String(dispatches.current));
      canvas.setAttribute("data-progress", u.uProgress.value.toFixed(3));
      canvas.setAttribute("data-particles", String(quality.count));
      if (!ready.current) { ready.current = true; queueMicrotask(() => props.onReady(gpu ? "webgpu" : "webgl")); }
    } catch { props.onFailure(); return; }
    if (animating && timer.current === null) {
      timer.current = setTimeout(() => { timer.current = null; invalidate(); }, props.compact ? 1000 / 30 : 0);
    }
  }, 1);
  return <primitive object={system.group} dispose={null} />;
}

function RendererCanvas(props: RevealCanvasProps & { assets: RevealAssets }) {
  const quality = revealQuality[props.compact ? "mobile" : "desktop"];
  const { compact, onFailure } = props;
  const pending = useRef<Promise<WebGPURenderer> | null>(null);
  const initialized = useRef(false);
  const disposal = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (disposal.current !== null) clearTimeout(disposal.current);
    return () => {
      // R3F's WebGL cleanup does not call WebGPURenderer.dispose(). Dispose our
      // owned device/buffers explicitly; defer one task for StrictMode replay.
      disposal.current = setTimeout(() => {
        void pending.current?.then((renderer) => {
          // dispose() calls setAnimationLoop(), which would retry a failed init.
          if (initialized.current) renderer.dispose();
        });
      }, 0);
    };
  }, []);
  const createRenderer = useCallback((defaults: { canvas: RootState["gl"]["domElement"] | EventTarget }) => {
    // Cache the async factory through React rerenders while the adapter starts.
    if (!pending.current) {
      const renderer = new WebGPURenderer({ canvas: defaults.canvas as HTMLCanvasElement, antialias: !compact,
        alpha: false, powerPreference: "low-power", forceWebGL: !("gpu" in navigator && navigator.gpu) });
      renderer.setClearColor(0x050505, 1);
      pending.current = renderer.init().then(() => { initialized.current = true; return renderer; })
        .catch(() => { onFailure(); return renderer; });
    }
    return pending.current;
  }, [compact, onFailure]);
  return <Canvas orthographic camera={{ position: [0, 0, 5], zoom: 100, near: .1, far: 10 }}
    frameloop={props.active ? "demand" : "never"} dpr={[1, quality.dpr]} fallback={null} gl={createRenderer}>
    <Scene {...props} />
  </Canvas>;
}

export default function RevealCanvas(props: RevealCanvasProps) {
  const assets = useAssets(props.selection.style, props.compact, props.onFailure);
  const quality = revealQuality[props.compact ? "mobile" : "desktop"];
  return <div style={{ position: "absolute", inset: 0 }} aria-hidden="true" data-testid="color-reveal-canvas"
    data-count={quality.count} data-dpr-cap={quality.dpr} data-noise-octaves={quality.noiseOctaves} data-rendering={props.active ? "active" : "paused"}>
    <RevealBoundary onFailure={props.onFailure}>{assets && <RendererCanvas {...props} assets={assets} />}</RevealBoundary>
  </div>;
}
