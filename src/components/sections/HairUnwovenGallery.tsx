"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { SafeImage } from "../ui/SafeImage";
import { StyleInfo } from "../ui/StyleInfo";
import { StyleNavigation } from "../ui/StyleNavigation";
import { hairUnwovenStyles } from "@/data/hairUnwovenStyles";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReducedData } from "@/hooks/useReducedData";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { useSiteStore } from "@/store/useSiteStore";
import { go } from "@/lib/navigation";
import s from "./HairUnwovenGallery.module.css";

const HairLoomCanvas = dynamic(
  () => import("@/three/HairLoom/HairLoomCanvas"),
  { ssr: false },
);

type Engine = "idle" | "webgl" | "fallback";
type GalleryState = {
  currentIndex: number;
  nextIndex: number;
  direction: 1 | -1;
  transitionId: number;
  isTransitioning: boolean;
  engine: Engine;
  queuedDirection: 1 | -1 | null;
};

const wrap = (index: number) =>
  (index + hairUnwovenStyles.length) % hairUnwovenStyles.length;

const indexForSelection = (
  editorialStyleId: string | null,
  selectedStyleId: string | null,
) => {
  const index = hairUnwovenStyles.findIndex(
    (style) =>
      style.id === editorialStyleId ||
      (!editorialStyleId && style.styleId === selectedStyleId),
  );
  return index < 0 ? 0 : index;
};

export function HairUnwovenGallery() {
  const root = useRef<HTMLElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    axis: "x" | "y" | null;
    triggered: boolean;
  } | null>(null);
  const wheelAmount = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasReadyRef = useRef(false);
  const canUseWebGLRef = useRef(false);
  const [nearby, setNearby] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden,
  );
  const [canvasReady, setCanvasReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [gallery, setGallery] = useState<GalleryState>(() => {
    const state = useSiteStore.getState();
    const selectedIndex = indexForSelection(
      state.editorialStyleId,
      state.selectedStyleId,
    );
    return {
      currentIndex: selectedIndex,
      nextIndex: selectedIndex,
      direction: 1,
      transitionId: 0,
      isTransitioning: false,
      engine: "idle",
      queuedDirection: null,
    };
  });
  const reducedMotion = useReducedMotion();
  const reducedData = useReducedData();
  const webglSupported = useWebGLSupport();
  const tier = usePerformanceTier((state) => state.tier);
  const initialized = usePerformanceTier((state) => state.initialized);
  const salonOpen = useSiteStore((state) => state.salonOpen);

  useEffect(
    () =>
      useSiteStore.subscribe((state, previous) => {
        if (
          state.editorialStyleId === previous.editorialStyleId &&
          state.selectedStyleId === previous.selectedStyleId
        )
          return;
        const selectedIndex = indexForSelection(
          state.editorialStyleId,
          state.selectedStyleId,
        );
        setGallery((current) =>
          current.isTransitioning || current.currentIndex === selectedIndex
            ? current
            : {
                ...current,
                currentIndex: selectedIndex,
                nextIndex: selectedIndex,
                queuedDirection: null,
                engine: "idle",
              },
        );
      }),
    [],
  );

  const shouldRenderWebGL =
    nearby &&
    initialized &&
    tier !== "low" &&
    webglSupported &&
    !reducedMotion &&
    !reducedData &&
    !webglFailed;

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      const timer = setTimeout(() => {
        setNearby(true);
        setGalleryVisible(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setNearby(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px" },
    );
    observer.observe(node);
    const visibilityObserver = new IntersectionObserver((entries) => {
      setGalleryVisible(Boolean(entries[0]?.isIntersecting));
    });
    visibilityObserver.observe(node);
    return () => {
      observer.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    canUseWebGLRef.current = shouldRenderWebGL;
    if (!shouldRenderWebGL) {
      canvasReadyRef.current = false;
      const timer = setTimeout(() => {
        setCanvasReady(false);
        setGallery((current) =>
          current.isTransitioning && current.engine === "webgl"
            ? { ...current, engine: "fallback" }
            : current,
        );
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [shouldRenderWebGL]);

  const completeTransition = useCallback((transitionId: number) => {
    setGallery((current) => {
      if (
        !current.isTransitioning ||
        current.transitionId !== transitionId
      )
        return current;
      const settledIndex = current.nextIndex;
      const queued = current.queuedDirection;
      if (queued) {
        return {
          currentIndex: settledIndex,
          nextIndex: wrap(settledIndex + queued),
          direction: queued,
          transitionId: current.transitionId + 1,
          isTransitioning: true,
          queuedDirection: null,
          engine:
            canUseWebGLRef.current && canvasReadyRef.current
              ? "webgl"
              : "fallback",
        };
      }
      return {
        ...current,
        currentIndex: settledIndex,
        nextIndex: settledIndex,
        isTransitioning: false,
        engine: "idle",
        queuedDirection: null,
      };
    });
  }, []);

  const requestStyle = useCallback((direction: 1 | -1) => {
    setGallery((current) => {
      if (current.isTransitioning) {
        return { ...current, queuedDirection: direction };
      }
      return {
        ...current,
        nextIndex: wrap(current.currentIndex + direction),
        direction,
        transitionId: current.transitionId + 1,
        isTransitioning: true,
        queuedDirection: null,
        engine:
          canUseWebGLRef.current && canvasReadyRef.current
            ? "webgl"
            : "fallback",
      };
    });
  }, []);

  const failWebGL = useCallback(() => {
    canvasReadyRef.current = false;
    setCanvasReady(false);
    setWebglFailed(true);
    setGallery((current) =>
      current.isTransitioning && current.engine === "webgl"
        ? { ...current, engine: "fallback" }
        : current,
    );
  }, []);

  const markCanvasReady = useCallback(() => {
    canvasReadyRef.current = true;
    setCanvasReady(true);
  }, []);

  useEffect(() => {
    if (
      !gallery.isTransitioning ||
      gallery.engine !== "fallback" ||
      salonOpen ||
      !galleryVisible ||
      !pageVisible
    )
      return;
    const timer = setTimeout(
      () => completeTransition(gallery.transitionId),
      reducedMotion ? 120 : 560,
    );
    return () => clearTimeout(timer);
  }, [
    gallery.isTransitioning,
    gallery.engine,
    gallery.transitionId,
    salonOpen,
    galleryVisible,
    pageVisible,
    reducedMotion,
    completeTransition,
  ]);

  useEffect(
    () => () => {
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
    },
    [],
  );

  const onWheel = (event: WheelEvent<HTMLElement>) => {
    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    wheelAmount.current += delta;
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => {
      wheelAmount.current = 0;
    }, 180);
    if (Math.abs(wheelAmount.current) >= 42) {
      requestStyle(wheelAmount.current > 0 ? 1 : -1);
      wheelAmount.current = 0;
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0))
      return;
    drag.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      axis: null,
      triggered: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current.x = Math.max(
      -1,
      Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2),
    );
    pointer.current.y = Math.max(
      -1,
      Math.min(1, -((event.clientY - rect.top) / rect.height - 0.5) * 2),
    );
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    active.lastX = event.clientX;
    active.lastY = event.clientY;
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    if (!active.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 10)
      active.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? "x" : "y";
    if (active.axis === "x" && !active.triggered && Math.abs(dx) > 42) {
      active.triggered = true;
      requestStyle(dx < 0 ? 1 : -1);
    }
  };

  const finishPointer = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (active?.id === event.pointerId) {
      const dx = active.lastX - active.startX;
      const dy = active.lastY - active.startY;
      if (
        !active.triggered &&
        Math.abs(dx) > 30 &&
        Math.abs(dx) > Math.abs(dy) * 1.15
      )
        requestStyle(dx < 0 ? 1 : -1);
      drag.current = null;
      pointer.current = { x: 0, y: 0 };
    }
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const cancelPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    pointer.current = { x: 0, y: 0 };
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (
      event.target instanceof Element &&
      event.target.closest("button, a")
    )
      return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      requestStyle(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      requestStyle(-1);
    }
  };

  const currentStyle = hairUnwovenStyles[gallery.currentIndex];
  const nextStyle = hairUnwovenStyles[gallery.nextIndex];
  const fallbackTransition =
    gallery.isTransitioning && gallery.engine === "fallback";

  const openStyle = () => {
    const state = useSiteStore.getState();
    state.setStyle(currentStyle.styleId);
    state.setViewerOpen(false);
    go("style");
  };

  const bookStyle = () => {
    const state = useSiteStore.getState();
    state.setStyle(currentStyle.styleId);
    useSiteStore.getState().setEditorialStyle(currentStyle.id);
    go("booking");
  };

  return (
    <section
      ref={root}
      className={s.gallery}
      aria-label="Hair Unwoven Gallery"
      aria-describedby="hair-unwoven-instructions"
      aria-busy={gallery.isTransitioning}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      data-testid="hair-unwoven-gallery"
      data-current-style={currentStyle.id}
      data-renderer={
        canvasReady && shouldRenderWebGL && gallery.engine !== "fallback"
          ? "webgl"
          : "fallback"
      }
      data-transitioning={gallery.isTransitioning}
    >
      <header className={s.heading}>
        <span>02 / EDITORIAL SELECTION</span>
        <h2>HAIR STYLE</h2>
        <p>YOUR HAIR, YOUR IDENTITY.</p>
      </header>
      <p id="hair-unwoven-instructions" className={s.srOnly}>
        左右キー、横ドラッグ、スワイプ、ホイール、または前後ボタンでスタイルを切り替えられます。
      </p>

      <div
        className={s.stage}
        data-testid="hair-unwoven-stage"
        data-cursor="DRAG"
        data-fallback-transitioning={fallbackTransition}
        data-transition-paused={salonOpen || !galleryVisible || !pageVisible}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={cancelPointer}
        onLostPointerCapture={cancelPointer}
        onPointerLeave={() => {
          if (!drag.current) pointer.current = { x: 0, y: 0 };
        }}
        aria-label="Drag horizontally to change hairstyle"
      >
        <div className={`${s.fallbackImage} ${s.fallbackCurrent}`}>
          <SafeImage
            src={currentStyle.image}
            alt={`${currentStyle.title} hairstyle`}
            fill
            sizes="(max-width: 700px) 88vw, 72vw"
            style={{
              objectPosition: `center ${(1 - currentStyle.focusY) * 100}%`,
            }}
          />
        </div>
        {gallery.isTransitioning && (
          <div className={`${s.fallbackImage} ${s.fallbackNext}`}>
            <SafeImage
              src={nextStyle.image}
              alt=""
              fill
              sizes="(max-width: 700px) 88vw, 72vw"
              style={{
                objectPosition: `center ${(1 - nextStyle.focusY) * 100}%`,
              }}
            />
          </div>
        )}
        {shouldRenderWebGL && (
          <HairLoomCanvas
            current={currentStyle}
            next={nextStyle}
            direction={gallery.direction}
            transitionId={gallery.transitionId}
            activeTransition={
              gallery.isTransitioning && gallery.engine === "webgl"
            }
            viewportActive={galleryVisible}
            pointer={pointer}
            onReady={markCanvasReady}
            onComplete={completeTransition}
            onFailure={failWebGL}
          />
        )}
        <div className={s.stageShade} aria-hidden="true" />
        <span className={s.gesture}>DRAG / SWIPE / SCROLL</span>
      </div>

      <div className={s.details}>
        <StyleInfo
          style={currentStyle}
          index={gallery.currentIndex}
          total={hairUnwovenStyles.length}
          isTransitioning={gallery.isTransitioning}
        />
        <StyleNavigation
          onPrevious={() => requestStyle(-1)}
          onNext={() => requestStyle(1)}
          isTransitioning={gallery.isTransitioning}
        />
        <div className={s.actions}>
          <button
            type="button"
            className={s.viewButton}
            onClick={openStyle}
            disabled={gallery.isTransitioning}
            aria-label={`VIEW STYLE — ${currentStyle.title}`}
          >
            VIEW STYLE <span aria-hidden="true">↗</span>
          </button>
          <button
            type="button"
            className={s.bookButton}
            onClick={bookStyle}
            disabled={gallery.isTransitioning}
            aria-label={`BOOK THIS STYLE — ${currentStyle.title}`}
          >
            BOOK THIS STYLE <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
      <div className={s.endLine} aria-hidden="true">
        <span>PHOTO</span>
        <span>HAIR / FLOW / IDENTITY</span>
        <span>04 LOOKS</span>
      </div>
    </section>
  );
}
