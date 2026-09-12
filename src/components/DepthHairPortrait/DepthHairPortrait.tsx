"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReducedData } from "@/hooks/useReducedData";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { SafeImage } from "../ui/SafeImage";
import { depthPortraits, portraitBookingPath, portraitColors, portraitTones, type DepthPortraitSelection } from "./model";
import { setPortraitSelection, usePortraitSelection } from "./usePortraitSelection";
import type { PortraitPointer } from "@/three/DepthHairPortrait/DepthPortraitCanvas";
import s from "./DepthHairPortrait.module.css";

const PortraitCanvas = dynamic(() => import("@/three/DepthHairPortrait/DepthPortraitCanvas"), { ssr: false });
const query = "(pointer: coarse), (max-width: 767px)";
const subscribeQuality = (notify: () => void) => {
  const media = matchMedia(query); media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
export type DepthHairPortraitProps = {
  value?: DepthPortraitSelection;
  onSelectionChange?: (selection: DepthPortraitSelection) => void;
  onBook?: (selection: DepthPortraitSelection) => void;
  bookingHref?: (selection: DepthPortraitSelection) => string;
  active?: boolean;
};

export function DepthHairPortrait({ value, onSelectionChange, onBook, bookingHref = portraitBookingPath, active = true }: DepthHairPortraitProps) {
  const persisted = usePortraitSelection();
  const selection = value ?? persisted;
  const asset = depthPortraits[selection.style];
  const id = useId();
  const stage = useRef<HTMLDivElement>(null);
  const pointer = useRef<PortraitPointer>({ x: 0, y: 0 });
  const wake = useRef<() => void>(() => {});
  const drag = useRef<{ id: number; x: number; y: number; vertical: boolean } | null>(null);
  const [nearby, setNearby] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const [readyKey, setReadyKey] = useState("");
  const [motion, setMotion] = useState(true);
  const [original, setOriginal] = useState(false);
  const [viewPosition, setViewPosition] = useState(0);
  const compactDevice = useSyncExternalStore(subscribeQuality, () => matchMedia(query).matches, () => true);
  const reducedData = useReducedData();
  const compact = compactDevice || reducedData;
  const reducedMotion = useReducedMotion();
  const webgl = useWebGLSupport();
  const canvasKey = `${selection.style}-${compact}`;
  const onReady = useCallback(() => setReadyKey(canvasKey), [canvasKey]);
  const onFailure = useCallback(() => setFailed(true), []);
  const onWakeChange = useCallback((next: () => void) => { wake.current = next; }, []);
  const live = readyKey === canvasKey && !failed && webgl;
  const engine = failed || !webgl ? "fallback" : live ? "webgl" : "loading";
  const canMove = motion && !reducedMotion && !original;

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const near = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNearby(true); }, { rootMargin: "240px" });
    const viewport = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    near.observe(node); viewport.observe(node);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility); visibility();
    return () => { near.disconnect(); viewport.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  const choose = (color: DepthPortraitSelection["color"]) => {
    const next = { ...selection, color };
    setPortraitSelection(next);
    onSelectionChange?.(next);
    setOriginal(false);
  };
  const resetPointer = () => { drag.current = null; pointer.current.x = viewPosition / 100; pointer.current.y = 0; wake.current(); };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!canMove) return;
    if (event.pointerType === "touch") {
      const touch = drag.current;
      if (!touch || touch.id !== event.pointerId || touch.vertical) return;
      const dx = event.clientX - touch.x, dy = event.clientY - touch.y;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { touch.vertical = true; return; }
      if (Math.abs(dx) < 6) return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current.x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    pointer.current.y = Math.max(-1, Math.min(1, 1 - (event.clientY - rect.top) / rect.height * 2));
    wake.current();
  };
  return <section id="depth-hair-portrait" className={s.section} aria-label="Depth Hair Portrait" data-testid="depth-hair-portrait"
    data-style={selection.style} data-color={selection.color} data-engine={engine}>
    <header className={s.heading}>
      <div><p className={s.eyebrow}>NŌIR / PORTRAIT SERIES — 01</p><h2>DEPTH HAIR<br /><em>PORTRAIT.</em></h2></div>
      <p className={s.intro}>角度で変わる、髪の表情。<br />色と光を、あなたの感性で。</p>
    </header>
    <div className={s.workspace}>
      <div className={s.imageColumn}>
        <div ref={stage} className={s.stage} role="img" aria-label={`${asset.name} / ${selection.color.toUpperCase()} の奥行きポートレート`}
          onPointerDown={(event) => { if (event.pointerType === "touch") drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, vertical: false }; }}
          onPointerMove={move} onPointerUp={resetPointer} onPointerCancel={resetPointer} onPointerLeave={resetPointer}>
          <div className={s.fallback} style={{ opacity: live ? 0 : 1 }}>
            <SafeImage src={compact ? asset.mobilePhoto : asset.photo} alt="" fill sizes="(max-width: 700px) 88vw, 440px" unoptimized />
            {!original && <div className={s.staticTint} style={{ backgroundColor: portraitTones[selection.color].swatch,
              opacity: selection.color === "beige" ? 0.08 : selection.color === "black" ? 0.84 : 0.48,
              maskImage: `url(${compact ? asset.mobileMask : asset.mask})`, WebkitMaskImage: `url(${compact ? asset.mobileMask : asset.mask})`,
              maskMode: "luminance",
            }} />}
          </div>
          {nearby && webgl && !failed && <PortraitCanvas key={canvasKey} selection={selection} compact={compact}
            active={active && visible && pageVisible} motion={motion} original={original} reducedMotion={reducedMotion}
            pointer={pointer} onWakeChange={onWakeChange} onReady={onReady} onFailure={onFailure} />}
          <span className={s.photoLabel} aria-hidden="true">{original ? "ORIGINAL PHOTOGRAPH" : "SILK STRAIGHT / " + selection.color.toUpperCase()}</span>
        </div>
        <div className={s.imageCaption}><span>PORTRAIT N° 01</span><span>{engine === "fallback" ? "STATIC PREVIEW" : "A CHANGE OF PERSPECTIVE"}</span></div>
      </div>
      <div className={s.controls}>
        <p className={s.eyebrow}>FIND YOUR EXPRESSION</p>
        <div className={s.styleInfo}><span>SELECTED STYLE</span><h3>{asset.name}</h3><p>{asset.description}</p></div>
        <fieldset className={s.colorGroup}>
          <legend>COLOR <span>髪色を選ぶ</span></legend>
          <div className={s.colors}>{portraitColors.map((color) => <label key={color} className={s.color} data-selected={selection.color === color}>
            <input type="radio" name={`${id}-color`} value={color} checked={selection.color === color} onChange={() => choose(color)} />
            <span className={s.swatch} style={{ "--tone": portraitTones[color].swatch } as CSSProperties} aria-hidden="true" />
            <span>{color.toUpperCase()}</span><span className={s.check} aria-hidden="true">{selection.color === color ? "−" : "+"}</span>
          </label>)}</div>
          <p className={s.toneDescription} aria-live="polite">{portraitTones[selection.color].label}</p>
        </fieldset>
        <div className={s.motionControls}>
          <div><span>A LITTLE PERSPECTIVE</span><button type="button" aria-label="奥行き効果" aria-pressed={motion && !reducedMotion} disabled={reducedMotion || engine === "fallback"}
            onClick={() => setMotion(!motion)}>{motion && !reducedMotion ? "ON" : "OFF"}<span aria-hidden="true">{motion && !reducedMotion ? "●" : "○"}</span></button></div>
          <label htmlFor={`${id}-view`}>視点を動かす<span>LEFT — RIGHT</span></label>
          <input id={`${id}-view`} aria-label="視点を動かす" type="range" min="-100" max="100" value={viewPosition}
            disabled={!canMove || engine === "fallback"} onChange={(event) => {
              const next = Number(event.target.value); setViewPosition(next); pointer.current.x = next / 100; pointer.current.y = 0; wake.current();
            }} />
          <p>{reducedMotion ? "動きを抑えて表示しています。カラーはそのまま比較できます。" : engine === "fallback" ? "静止写真で表示しています。選択内容は予約へ引き継げます。" : compactDevice ? "写真を横になぞるか、スライダーで奥行きを感じてください。" : "写真の上でカーソルをゆっくり動かしてください。"}</p>
        </div>
        <button type="button" className={s.compare} aria-pressed={original} onClick={() => setOriginal(!original)}>COMPARE ORIGINAL <span>{original ? "選択カラーに戻る ↗" : "元の写真と比べる ↗"}</span></button>
        <div className={s.summary} aria-live="polite"><span>YOUR PORTRAIT</span><p>{asset.name} / {selection.color.toUpperCase()}</p></div>
        <a href={bookingHref(selection)} className={s.book} onClick={(event) => {
          if (onBook && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && event.button === 0) { event.preventDefault(); onBook({ ...selection }); }
        }}>BOOK THIS STYLE <span aria-hidden="true">↗</span></a>
        <p className={s.bookingHint}>このスタイルとカラーを予約・相談へ</p>
      </div>
    </div>
    <footer className={s.footer}><span>STILL A PHOTOGRAPH. A NEW PERSPECTIVE.</span><p>色・質感のイメージです。実際の仕上がりは髪の状態や施術で異なります。</p></footer>
  </section>;
}
