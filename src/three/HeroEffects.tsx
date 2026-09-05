"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { useSiteStore } from "@/store/useSiteStore";
import { useReducedData } from "@/hooks/useReducedData";
const ParticleCanvas = dynamic(() => import("./ParticleHead/ParticleCanvas"), {
  ssr: false,
});
export function HeroEffects() {
  const saveData = useReducedData();
  const supported = useWebGLSupport(),
    reduced = useReducedMotion();
  const [startedAt, setStartedAt] = useState(0);
  const opening = startedAt > 0;
  const overlay = useRef<HTMLDivElement>(null);
  const salon = useSiteStore((s) => s.salonOpen);
  useEffect(() => {
    if (location.pathname !== "/" || saveData) return;
    let tween: gsap.core.Tween | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    // Wait for client capability snapshots before marking this session visited.
    const start = setTimeout(() => {
      let visited = true;
      try {
        visited = Boolean(sessionStorage.getItem("noir-opening"));
        sessionStorage.setItem("noir-opening", "1");
      } catch {
        /* Storage blocked: short fade. */
      }
      if (visited || reduced || !supported) {
        tween = gsap.fromTo(
          "[data-hero-photo]",
          { opacity: 0.6 },
          { opacity: 1, duration: reduced ? 0.2 : 0.65 },
        );
      } else {
        setStartedAt(performance.now());
        deadline = setTimeout(() => setStartedAt(0), 4300);
      }
    }, 50);
    return () => {
      clearTimeout(start);
      clearTimeout(deadline);
      tween?.kill();
    };
  }, [supported, reduced, saveData]);
  useEffect(() => {
    const node = overlay.current;
    if (!node || !opening) return;
    let cancelled = false;
    let tween: gsap.core.Tween | undefined;
    const image = document.querySelector<HTMLImageElement>(
      "[data-hero-photo] img",
    );
    const ready = image?.decode().catch(() => {}) ?? Promise.resolve();
    void ready.then(() => {
      if (cancelled) return;
      tween = gsap.to(node, {
        opacity: 0,
        delay: 3,
        duration: 0.8,
        onComplete: () => setStartedAt(0),
      });
    });
    return () => {
      cancelled = true;
      tween?.kill();
    };
  }, [opening]);
  useEffect(() => {
    if (reduced || salon || !matchMedia("(pointer: fine)").matches) return;
    const photo = document.querySelector<HTMLElement>("[data-hero-photo]");
    if (!photo) return;
    const x = gsap.quickTo(photo, "x", { duration: 0.8 }),
      y = gsap.quickTo(photo, "y", { duration: 0.8 });
    const move = (event: PointerEvent) => {
      x((event.clientX / innerWidth - 0.5) * 16);
      y((event.clientY / innerHeight - 0.5) * 12);
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      x.tween.kill();
      y.tween.kill();
      gsap.set(photo, { clearProps: "transform" });
    };
  }, [reduced, salon]);
  return (
    <>
      {supported && !reduced && !saveData && !opening && (
        <div className="hero-ambient">
          <ParticleCanvas />
        </div>
      )}
      {opening && (
        <>
          <div
            ref={overlay}
            className="particle-opening"
            data-testid="particle-opening"
          >
            <ParticleCanvas
              opening
              startedAt={startedAt}
              onFailure={() => setStartedAt(0)}
            />
          </div>
          <button className="opening-skip" onClick={() => setStartedAt(0)}>
            SKIP INTRO ↗
          </button>
        </>
      )}
    </>
  );
}
