"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  hairJourney,
  hairJourneyChapterIndex,
  hairJourneyColorLabel,
} from "@/data/hairJourney";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReducedData } from "@/hooks/useReducedData";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { useSiteStore } from "@/store/useSiteStore";
import { go } from "@/lib/navigation";
import { SafeImage } from "../ui/SafeImage";
import { HairJourneyChapter } from "../ui/HairJourneyChapter";
import { HairJourneyProgress } from "../ui/HairJourneyProgress";
import { HairJourneyCTA } from "../ui/HairJourneyCTA";
import s from "./CinematicHairJourney.module.css";

const CinematicHairCanvas = dynamic(
  () => import("@/three/CinematicHairJourney/CinematicHairCanvas"),
  { ssr: false },
);

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function CinematicHairJourney() {
  const root = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const activeIndexRef = useRef(0);
  const ctaInteractiveRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ctaInteractive, setCtaInteractive] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden,
  );
  const [canvasReady, setCanvasReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const reducedMotion = useReducedMotion();
  const reducedData = useReducedData();
  const webglSupported = useWebGLSupport();
  const tier = usePerformanceTier((state) => state.tier);
  const tierInitialized = usePerformanceTier((state) => state.initialized);
  const salonOpen = useSiteStore((state) => state.salonOpen);
  const staticMode =
    reducedMotion ||
    reducedData ||
    !webglSupported ||
    webglFailed ||
    (tierInitialized && tier === "low");
  const shouldRenderWebGL =
    nearby &&
    (!tierInitialized || tier !== "low") &&
    webglSupported &&
    !reducedMotion &&
    !reducedData &&
    !webglFailed;

  const updatePresentation = useCallback((rawProgress: number) => {
    const section = root.current;
    const stage = sticky.current;
    if (!section || !stage) return;

    const progress = clamp01(rawProgress);
    const finalProgress = clamp01((progress - 0.885) / 0.105);
    progressRef.current = progress;
    section.style.setProperty("--journey-progress", String(progress));
    section.style.setProperty("--journey-progress-width", `${progress * 100}%`);
    section.style.setProperty("--journey-final-progress", String(finalProgress));
    section.style.setProperty(
      "--journey-final-scale",
      String(1.025 - finalProgress * 0.025),
    );
    section.style.setProperty("--journey-skew", `${progress * 6}deg`);
    section.style.setProperty("--journey-mobile-skew", `${progress * 5}deg`);
    section.style.setProperty("--journey-cut", `${progress * 16}%`);
    section.style.setProperty(
      "--journey-saturation",
      String(0.7 + progress * 0.35),
    );
    section.style.setProperty(
      "--journey-sweep",
      `${(progress - 0.56) * 180}%`,
    );
    section.style.setProperty(
      "--journey-sweep-opacity",
      String(progress * 0.48),
    );
    section.style.setProperty(
      "--journey-cue-opacity",
      String(clamp01(1 - progress * 4)),
    );

    const nextIndex = hairJourneyChapterIndex(progress);
    if (nextIndex !== activeIndexRef.current) {
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }

    const current = hairJourney.chapters[nextIndex];
    const following = hairJourney.chapters[nextIndex + 1] ?? current;
    const span = Math.max(0.001, current.end - current.start);
    const local = clamp01((progress - current.start) / span);
    const background = gsap.utils.interpolate(
      current.background,
      following.background,
      clamp01((local - 0.68) / 0.32),
    );
    gsap.set(stage, { backgroundColor: background });

    section
      .querySelectorAll<HTMLElement>("[data-journey-chapter]")
      .forEach((node) => {
        const start = Number(node.dataset.start ?? 0);
        const end = Number(node.dataset.end ?? 1);
        const chapterSpan = Math.max(0.001, end - start);
        const rawChapterLocal = (progress - start) / chapterSpan;
        const chapterLocal = clamp01(rawChapterLocal);
        const enter =
          start === 0 ? 1 : clamp01((rawChapterLocal + 0.12) / 0.22);
        const exit =
          end === 1
            ? 1
            : 1 - clamp01((chapterLocal - 0.76) / 0.24);
        const opacity = enter * exit;
        const y =
          chapterLocal < 0.5
            ? (1 - enter) * 24
            : -(1 - exit) * 16;
        gsap.set(node, {
          opacity,
          y,
          filter: `blur(${(1 - opacity) * 8}px)`,
          visibility: opacity < 0.01 ? "hidden" : "visible",
        });
      });

    const colorLabel = section.querySelector<HTMLElement>(
      "[data-journey-color]",
    );
    const nextColorLabel = hairJourneyColorLabel(progress);
    if (colorLabel && colorLabel.textContent !== nextColorLabel)
      colorLabel.textContent = nextColorLabel;

    const cta = section.querySelector<HTMLElement>("[data-journey-cta]");
    if (cta) {
      const reveal = clamp01((progress - 0.91) / 0.07);
      const interactive = reveal > 0.69;
      if (interactive !== ctaInteractiveRef.current) {
        ctaInteractiveRef.current = interactive;
        setCtaInteractive(interactive);
      }
      gsap.set(cta, {
        opacity: reveal,
        y: (1 - reveal) * 22,
        visibility: reveal < 0.01 ? "hidden" : "visible",
        pointerEvents: interactive ? "auto" : "none",
      });
    }
  }, []);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    if (!("IntersectionObserver" in window)) {
      const timer = setTimeout(() => {
        setNearby(true);
        setVisible(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    const nearbyObserver = new IntersectionObserver(
      (entries) => {
        const isNearby = Boolean(entries[0]?.isIntersecting);
        setNearby(isNearby);
        if (!isNearby) setCanvasReady(false);
      },
      { rootMargin: "85% 0px" },
    );
    const visibilityObserver = new IntersectionObserver((entries) => {
      setVisible(Boolean(entries[0]?.isIntersecting));
    });
    nearbyObserver.observe(section);
    visibilityObserver.observe(section);
    return () => {
      nearbyObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (staticMode) {
      updatePresentation(1);
      return;
    }

    const section = root.current;
    const pinTarget = sticky.current;
    if (!section || !pinTarget) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      updatePresentation(0);
      media.add("(min-width: 901px)", () => {
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 4.35)}`,
          pin: pinTarget,
          pinSpacing: true,
          scrub: 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => updatePresentation(self.progress),
        });
        return () => trigger.kill();
      });
      media.add("(max-width: 900px)", () => {
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.45,
          invalidateOnRefresh: true,
          onUpdate: (self) => updatePresentation(self.progress),
        });
        return () => trigger.kill();
      });
    }, section);
    return () => {
      media.revert();
      context.revert();
    };
  }, [staticMode, updatePresentation]);

  const setJourneySelection = useCallback(() => {
    const state = useSiteStore.getState();
    state.setStyle(hairJourney.finalStyle.styleId);
    useSiteStore.getState().setColor(hairJourney.finalStyle.color);
    useSiteStore
      .getState()
      .setEditorialStyle(hairJourney.finalStyle.editorialStyleId);
  }, []);

  const viewStyle = useCallback(() => {
    setJourneySelection();
    useSiteStore.getState().setViewerOpen(false);
    go("style");
  }, [setJourneySelection]);

  const bookStyle = useCallback(() => {
    setJourneySelection();
    go("booking");
  }, [setJourneySelection]);

  const handleCanvasReady = useCallback(() => {
    setCanvasReady(true);
  }, []);

  const handleWebglFailure = useCallback(() => {
    setCanvasReady(false);
    setWebglFailed(true);
  }, []);

  const renderedActiveIndex = staticMode
    ? hairJourney.chapters.length - 1
    : activeIndex;

  return (
    <section
      ref={root}
      className={s.journey}
      aria-label="Cinematic Hair Journey"
      data-static={staticMode}
      data-renderer={canvasReady && shouldRenderWebGL ? "webgl" : "fallback"}
      data-active-chapter={hairJourney.chapters[renderedActiveIndex].id}
      data-testid="cinematic-hair-journey"
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointerRef.current.x =
          clamp01((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointerRef.current.y = -(
          clamp01((event.clientY - rect.top) / rect.height) * 2 -
          1
        );
      }}
      onPointerLeave={() => {
        pointerRef.current = { x: 0, y: 0 };
      }}
    >
      <div ref={sticky} className={s.sticky}>
        <span className={s.eyebrow}>{hairJourney.eyebrow}</span>

        <div className={s.visual} aria-hidden="true">
          <div className={s.fallbackRibbon} />
          <div className={s.finalPhoto}>
            <SafeImage
              src={hairJourney.finalStyle.image}
              alt=""
              fill
              sizes="100vw"
              style={{ objectFit: "cover", objectPosition: hairJourney.finalStyle.imagePosition }}
            />
          </div>
          {shouldRenderWebGL && (
            <CinematicHairCanvas
              progressRef={progressRef}
              pointerRef={pointerRef}
              active={visible && pageVisible && !salonOpen}
              finalImage={hairJourney.finalStyle.image}
              onReady={handleCanvasReady}
              onFailure={handleWebglFailure}
            />
          )}
          <div className={s.vignette} />
        </div>

        <div className={s.chapterLayer}>
          {hairJourney.chapters.map((chapter, index) => (
            <HairJourneyChapter
              key={chapter.id}
              chapter={chapter}
              active={index === renderedActiveIndex}
            />
          ))}
        </div>

        <HairJourneyProgress
          chapters={hairJourney.chapters}
          activeIndex={renderedActiveIndex}
        />
        <HairJourneyCTA
          title={hairJourney.finalStyle.title}
          active={staticMode || ctaInteractive}
          onViewStyle={viewStyle}
          onBookStyle={bookStyle}
        />
        <span className={s.scrollCue} aria-hidden="true">
          SCROLL TO TRANSFORM <i />
        </span>
      </div>

      {staticMode && (
        <div className={s.staticStory}>
          <ol>
            {hairJourney.chapters.map((chapter) => (
              <li key={chapter.id}>
                <span>{chapter.number}</span>
                <div>
                  <strong>{chapter.title}</strong>
                  <p>{chapter.copy}</p>
                  {chapter.id === "color" && (
                    <p>BLACK / DARK BROWN / ASH / ASH BEIGE</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className={s.staticPhoto}>
            <SafeImage
              src={hairJourney.finalStyle.image}
              alt={`${hairJourney.finalStyle.title} hairstyle`}
              fill
              sizes="(max-width: 700px) 88vw, 54vw"
              style={{ objectFit: "cover", objectPosition: hairJourney.finalStyle.imagePosition }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
