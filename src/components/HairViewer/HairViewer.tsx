"use client";
import { HairImage as Image } from "../ui/HairImage";
import { useEffect, useRef, type PointerEvent } from "react";
import { styleById } from "@/data/styles";
import { useSiteStore } from "@/store/useSiteStore";
import { hairStyles, colorById } from "@/data/hairStyles";
import { DRAG_STEP, wrapAngle } from "@/lib/constants";
import { preloadImages } from "@/lib/preload";
import { useMotion } from "@/lib/useMotion";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
import { ColorComparison } from "@/three/ColorComparison";
import { hairTextureWidth, resolveHairAsset } from "@/lib/hairAssets";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
export function HairViewer() {
  const mode = useSiteStore((state) => state.mode);
  const targetRef = useRef<HTMLDivElement>(null);
  const color = useSiteStore((state) => state.selectedColor);
  const angle = useSiteStore((state) => state.selectedAngle);
  const styleId = useSiteStore((state) => state.selectedStyleId);
  const frames = styleById(styleId)?.hairImages ?? hairStyles;
  const hasRotated = useSiteStore((state) => state.hasRotated);
  const tier = usePerformanceTier((state) => state.tier);
  const imageRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    angle: number;
    locked: boolean;
  } | null>(null);
  const src = frames[color]?.[angle] ?? "/images/placeholder.svg";
  useMotion(imageRef, String(styleId), "image");
  useEffect(() => {
    const targetWidth = hairTextureWidth(tier);
    preloadImages(
      [
        frames[color]?.[wrapAngle(angle - 1)],
        frames[color]?.[wrapAngle(angle + 1)],
      ]
        .filter((url): url is string => Boolean(url))
        .map((url) => resolveHairAsset(url, targetWidth)),
    );
  }, [color, angle, frames, tier]);
  const step = (direction: number) => {
    const state = useSiteStore.getState();
    state.setAngle(state.selectedAngle + direction);
    state.markRotated();
  };
  function down(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      angle,
      locked: false,
    };
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (!g.locked) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        gesture.current = null;
        return;
      }
      if (Math.abs(dx) < 8) return;
      g.locked = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    useSiteStore.getState().setAngle(g.angle - dx / DRAG_STEP);
    useSiteStore.getState().markRotated();
  }
  function end(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (g?.id !== e.pointerId) return;
    if (g.locked) {
      useSiteStore.getState().setAngle(g.angle - (e.clientX - g.x) / DRAG_STEP);
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
    }
    gesture.current = null;
  }
  return (
    <div className={s.viewer}>
      <div
        className={s.viewerImage}
        ref={targetRef}
        data-cursor="DRAG"
        data-testid="hair-viewer"
        role="group"
        aria-label="360度ヘアビューアー。左右矢印キーでも回転できます"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            step(e.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={() => {
          gesture.current = null;
        }}
        onLostPointerCapture={(e) => {
          if (e.target === e.currentTarget) gesture.current = null;
        }}
      >
        <div ref={imageRef} className={s.frame}>
          <Image
            key={src}
            src={src}
            alt={`${colorById(color).ja}のヘアモデル・角度${String(angle + 1).padStart(2, "0")}`}
            fill
            unoptimized
            draggable={false}
            priority
            sizes="(max-width:700px) 88vw, (max-width:1024px) 43vw, 34vw"
            style={{ objectFit: "contain" }}
          />
        </div>
        {mode === "color" && <ColorComparison target={targetRef} />}
        <span className={s.viewerDemo}>COLOR STUDY / SAMPLE MODEL</span>
        {!hasRotated && (
          <span className={s.dragHint}>← &nbsp; DRAG TO ROTATE &nbsp; →</span>
        )}
      </div>
      <div className={s.angleControls}>
        <button onClick={() => step(-1)} aria-label="ひとつ前の角度">
          <Arrow direction="left" />
        </button>
        <div className={s.angleDots}>
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                useSiteStore.getState().setAngle(i);
                useSiteStore.getState().markRotated();
              }}
              aria-label={`角度 ${i + 1}`}
              aria-pressed={angle === i}
            >
              <span />
            </button>
          ))}
        </div>
        <button onClick={() => step(1)} aria-label="ひとつ次の角度">
          <Arrow />
        </button>
      </div>
      <p className={s.angleLabel} aria-live="polite">
        ANGLE{" "}
        <strong data-testid="angle-index">
          {String(angle + 1).padStart(2, "0")}
        </strong>{" "}
        / 08 <span>{angle * 45}°</span>
      </p>
    </div>
  );
}
