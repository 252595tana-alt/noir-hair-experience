"use client";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  qualityProfiles,
  usePerformanceTier,
} from "@/hooks/usePerformanceTier";
import { useSiteStore } from "@/store/useSiteStore";
import { PerformanceManager } from "./Performance/PerformanceManager";
export class WebGLErrorBoundary extends Component<
  { children: ReactNode; onFailure?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function ContextGuard({ fail }: { fail: () => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const diagnostic = setInterval(() => {
      if (!document.hidden)
        canvas.setAttribute("data-textures", String(gl.info.memory.textures));
    }, 1000);
    const lost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      clearInterval(diagnostic);
    };
  }, [gl, fail]);
  return null;
}
export default function WebGLExperience({
  children,
  onFailure,
  continuous = false,
  fps = 60,
}: {
  children: ReactNode;
  onFailure?: () => void;
  continuous?: boolean;
  fps?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [failed, setFailed] = useState(false);
  const salon = useSiteStore((s) => s.salonOpen);
  const tier = usePerformanceTier((s) => s.tier);
  const fail = useCallback(() => {
    setFailed(true);
    onFailure?.();
  }, [onFailure]);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    let inView = true;
    const update = () => setActive(inView && !document.hidden);
    const observer = new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      update();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div
      ref={container}
      className="webgl-layer"
      aria-hidden="true"
      data-webgl={failed ? "fallback" : "ready"}
      data-quality={tier}
      data-rendering={active && !salon ? "active" : "paused"}
    >
      {!failed && (
        <WebGLErrorBoundary onFailure={fail}>
          <Canvas
            frameloop={active && !salon ? "demand" : "never"}
            dpr={[1, qualityProfiles[tier].dpr]}
            gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
              gl.debug.onShaderError = () => fail();
            }}
            fallback={null}
          >
            <ContextGuard fail={fail} />
            <PerformanceManager fps={fps} />
            <FrameDriver
              active={active && !salon}
              continuous={continuous}
              fps={fps}
            />
            {children}
          </Canvas>
        </WebGLErrorBoundary>
      )}
    </div>
  );
}
function FrameDriver({
  active,
  continuous,
  fps,
}: {
  active: boolean;
  continuous: boolean;
  fps: number;
}) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!active) return;
    invalidate();
    if (!continuous) {
      const wake = () => invalidate();
      window.addEventListener("pointermove", wake, { passive: true });
      return () => window.removeEventListener("pointermove", wake);
    }
    const timer = setInterval(invalidate, 1000 / fps);
    return () => clearInterval(timer);
  }, [active, continuous, fps, invalidate]);
  return null;
}
