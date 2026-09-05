"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { useSiteStore } from "@/store/useSiteStore";
import { useReducedData } from "@/hooks/useReducedData";
import type { PortraitSamples, FormationClock } from "./ParticleHead/ParticleHead";
const ParticleCanvas = dynamic(() => import("./ParticleHead/ParticleCanvas"), { ssr: false });
const sessionKey = "noir-opening-portrait-v4";
let cachedPortrait: PortraitSamples | undefined;

export function HeroEffects() {
  const saveData = useReducedData(), supported = useWebGLSupport(), reduced = useReducedMotion();
  const salon = useSiteStore(s => s.salonOpen);
  const [run, setRun] = useState(0);
  const [portrait, setPortrait] = useState<PortraitSamples | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const clock = useRef<FormationClock>({ elapsed: 0 });
  const sequence = useRef(0), active = useRef(false), ready = useRef(false);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const restore = useCallback(() => {
    const hero = root.current?.closest<HTMLElement>("[data-intro]");
    const photo = hero?.querySelector<HTMLElement>("[data-hero-photo]");
    if (hero) hero.dataset.intro = "rest";
    if (photo) {
      gsap.set(photo, { clearProps: "filter,transform" });
      gsap.set(photo, { opacity: 1 });
    }
  }, []);
  const finish = useCallback(() => {
    active.current = false;
    clearTimeout(deadline.current);
    timeline.current?.kill();
    timeline.current = null;
    restore();
    setRun(0);
  }, [restore]);
  const skip = useCallback(() => {
    try { sessionStorage.setItem(sessionKey, "1"); } catch { /* Optional storage. */ }
    finish();
  }, [finish]);
  const begin = useCallback(() => {
    if (!supported || reduced || saveData) return;
    timeline.current?.kill();
    active.current = true;
    ready.current = false;
    clock.current.elapsed = 0;
    const hero = root.current?.closest<HTMLElement>("[data-intro]");
    const photo = hero?.querySelector<HTMLElement>("[data-hero-photo]");
    if (hero) hero.dataset.intro = "loading";
    if (photo) gsap.set(photo, { opacity: .035 });
    setPortrait(null);
    setRun(++sequence.current);
    clearTimeout(deadline.current);
    // Slow/blocked resources reveal the photo instead of forcing a loading screen.
    deadline.current = setTimeout(finish, 1800);
  }, [supported, reduced, saveData, finish]);

  useEffect(() => {
    const timer = setTimeout(() => {
      let visited = false;
      try { visited = sessionStorage.getItem(sessionKey) === "1"; } catch { /* Session storage is optional. */ }
      if (location.pathname !== "/" || visited || reduced || !supported || saveData) { finish(); return; }
      begin();
    }, 40);
    return () => clearTimeout(timer);
  }, [begin, finish, supported, reduced, saveData]);

  useEffect(() => {
    if (!run) return;
    let cancelled = false;
    const controller = new AbortController();
    const samples = cachedPortrait ? Promise.resolve(cachedPortrait) : fetch("/data/hero-particles.json", { signal: controller.signal })
      .then(async response => { if (!response.ok) throw Error("Portrait unavailable"); return response.json() as Promise<PortraitSamples>; })
      .then(data => {
        if (!data.width || !data.height || data.points?.length !== 30000 || !data.points.every(n => Number.isFinite(n) && n >= 0 && n <= 1)) throw Error("Invalid portrait samples");
        cachedPortrait = data;
        return data;
      });
    void samples.then(data => {
      if (!cancelled && active.current) setPortrait(data);
    }).catch(() => { if (!cancelled) finish(); });
    return () => { cancelled = true; controller.abort(); };
  }, [run, finish]);

  const onReady = useCallback(() => {
    if (!active.current || ready.current) return;
    ready.current = true;
    try { sessionStorage.setItem(sessionKey, "1"); } catch { /* The replay still works. */ }
    clearTimeout(deadline.current);
    const hero = root.current?.closest<HTMLElement>("[data-intro]");
    const photo = hero?.querySelector<HTMLElement>("[data-hero-photo]");
    if (!hero || !photo) { finish(); return; }
    hero.dataset.intro = "forming";
    gsap.set(photo, { opacity: 0, filter: "blur(8px) saturate(.72)", scale: 1.012 });
    if (halo.current) gsap.set(halo.current, { opacity: 0, scale: .72 });
    const motion = gsap.timeline({ onComplete: finish });
    timeline.current = motion;
    motion.to(clock.current, {
      elapsed: 3.25, duration: 3.25, ease: "none",
      onUpdate: () => {
        const t = clock.current.elapsed;
        hero.dataset.intro = t < 1.75 ? "forming" : t < 2.15 ? "portrait" : "revealing";
      },
    }, 0);
    motion.to(photo, { opacity: usePerformanceTier.getState().mobile ? .13 : .045, duration: .55, ease: "power1.inOut" }, .82);
    if (halo.current) {
      motion.to(halo.current, { opacity: .52, scale: 1, duration: 1.05, ease: "power2.out" }, .62);
      motion.to(halo.current, { opacity: 0, scale: 1.14, duration: 1.05, ease: "power2.in" }, 1.92);
    }
    motion.to(photo, { opacity: 1, filter: "blur(0px) saturate(1)", scale: 1, duration: 1.05, ease: "power2.out" }, 2.15);
    motion.paused(document.hidden || useSiteStore.getState().salonOpen);
    deadline.current = setTimeout(finish, 6500);
  }, [finish]);

  useEffect(() => {
    const update = () => timeline.current?.paused(document.hidden || useSiteStore.getState().salonOpen);
    document.addEventListener("visibilitychange", update);
    update();
    return () => document.removeEventListener("visibilitychange", update);
  }, [salon]);
  useEffect(() => () => {
    active.current = false;
    clearTimeout(deadline.current);
    timeline.current?.kill();
    restore();
  }, [restore]);
  useEffect(() => {
    if (run || reduced || salon || !matchMedia("(pointer: fine)").matches) return;
    const photo = root.current?.closest("[data-intro]")?.querySelector<HTMLElement>("[data-hero-photo]");
    if (!photo) return;
    const x = gsap.quickTo(photo, "x", { duration: .8 }), y = gsap.quickTo(photo, "y", { duration: .8 });
    const move = (event: PointerEvent) => {
      if (document.hidden) return;
      if (photo.querySelector('[data-rotating="true"]')) return;
      x((event.clientX / innerWidth - .5) * 16);
      y((event.clientY / innerHeight - .5) * 12);
    };
    window.addEventListener("pointermove", move);
    return () => { window.removeEventListener("pointermove", move); x.tween.kill(); y.tween.kill(); gsap.set(photo, { clearProps: "transform" }); };
  }, [run, reduced, salon]);
  return <>
    <div ref={root} className="hero-effects-anchor" aria-hidden="true" />
    {run > 0 && <>
      <div className="particle-opening" data-testid="particle-opening" aria-hidden="true">
        <div ref={halo} className="formation-halo" />
        {portrait && <ParticleCanvas key={run} portrait={portrait} clock={clock} onReady={onReady} onFailure={finish} />}
      </div>
      <button className="opening-skip" onClick={skip} aria-label="イントロをスキップ">SKIP</button>
    </>}
    {!run && supported && !reduced && !saveData && <button className="opening-replay" onClick={begin} aria-label="人物形成の演出を再生" title="人物形成の演出を再生">↻</button>}
  </>;
}
