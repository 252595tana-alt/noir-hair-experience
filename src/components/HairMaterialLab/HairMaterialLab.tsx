"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import type { MaterialLight } from "@/three/HairMaterialLab/HairMaterialCanvas";
import { defaultMaterialSelection, materialBookingPath, materialColors, materialPalette, materialStyles, materialTextures, textureProfiles, type HairMaterialSelection } from "./model";
import { HairMaterialFallback } from "./HairMaterialFallback";
import s from "./HairMaterialLab.module.css";

const MaterialCanvas = dynamic(() => import("@/three/HairMaterialLab/HairMaterialCanvas"), { ssr: false });
const qualityQuery = "(max-width: 767px), (pointer: coarse)";
const subscribeQuality = (notify: () => void) => {
  const query = matchMedia(qualityQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

export type HairMaterialLabProps = {
  value?: HairMaterialSelection;
  defaultValue?: HairMaterialSelection;
  onSelectionChange?: (selection: HairMaterialSelection) => void;
  onBook?: (selection: HairMaterialSelection) => void;
  bookingHref?: (selection: HairMaterialSelection) => string;
  active?: boolean;
};

export function HairMaterialLab({ value, defaultValue = defaultMaterialSelection, onSelectionChange, onBook, bookingHref = materialBookingPath, active = true }: HairMaterialLabProps) {
  const [local, setLocal] = useState(defaultValue);
  const selection = value ?? local;
  const id = useId();
  const stage = useRef<HTMLDivElement>(null);
  const light = useRef<MaterialLight>({ x: 0, y: 0 });
  const wake = useRef<() => void>(() => {});
  const onWakeChange = useCallback((callback: () => void) => { wake.current = callback; }, []);
  const [visible, setVisible] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sweep, setSweep] = useState(true);
  const [lightPosition, setLightPosition] = useState(50);
  const compact = useSyncExternalStore(subscribeQuality, () => matchMedia(qualityQuery).matches, () => true);
  const reducedMotion = useReducedMotion();
  const webgl = useWebGLSupport();
  const fail = useCallback(() => setFailed(true), []);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    const preload = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNearby(true); }, { rootMargin: "240px" });
    observer.observe(node);
    preload.observe(node);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => { observer.disconnect(); preload.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  const choose = (key: keyof HairMaterialSelection, next: string) => {
    const updated = { ...selection, [key]: next } as HairMaterialSelection;
    setLocal(updated);
    onSelectionChange?.(updated);
  };
  const engine = failed || !webgl ? "fallback" : ready ? "webgl" : "loading";
  return (
    <section id="hair-material-lab" className={s.lab} aria-label="Hair Material Lab" data-testid="hair-material-lab"
      data-style={selection.style} data-color={selection.color} data-texture={selection.texture} data-engine={engine}>
      <header className={s.heading}>
        <div><p className={s.eyebrow}>NŌIR / MATERIAL STUDY</p><h2>HAIR MATERIAL <em>LAB.</em></h2></div>
        <p className={s.intro}>色、かたち、光のまとい方。<br />あなたの「なりたい」を、質感から。</p>
      </header>
      <div className={s.workspace}>
        <div className={s.preview}>
          <div className={s.stage} ref={stage} role="img" aria-label={`${selection.style.toUpperCase()} / ${selection.color.toUpperCase()} / ${selection.texture.toUpperCase()} の毛束プレビュー`}
            onPointerMove={(event) => {
              if (event.pointerType === "touch") return;
              const rect = event.currentTarget.getBoundingClientRect();
              light.current.x = (event.clientX - rect.left) / rect.width * 2 - 1;
              light.current.y = 1 - (event.clientY - rect.top) / rect.height * 2;
              wake.current();
            }} onPointerLeave={() => { light.current.x = (lightPosition - 50) / 50; light.current.y = 0; wake.current(); }}>
            <div className={s.stageTop} aria-hidden="true"><span>01 / THE FIBER</span><span>{selection.style.toUpperCase()}</span></div>
            <div className={s.fallback} style={{ opacity: ready && !failed ? 0 : 1 }}><HairMaterialFallback selection={selection} /></div>
            {nearby && webgl && !failed && <MaterialCanvas selection={selection} compact={compact}
              active={active && visible && pageVisible} reducedMotion={reducedMotion} sweep={sweep}
              light={light} onWakeChange={onWakeChange} onReady={markReady} onFailure={fail} />}
            <span className={s.stageNote} aria-hidden="true">{engine === "webgl" ? "LIGHT ON HAIR / LIVE" : engine === "loading" ? "PREPARING LIGHT…" : "STATIC MATERIAL PREVIEW"}</span>
          </div>
          <div className={s.lightControls}>
            <label htmlFor={`${id}-light`}>LIGHT POSITION <span>光を動かす</span></label>
            <input id={`${id}-light`} type="range" min="0" max="100" value={lightPosition} aria-label="光の位置" disabled={engine === "fallback"}
              onChange={(event) => { const position = Number(event.target.value); setLightPosition(position); light.current.x = (position - 50) / 50; light.current.y = 0; wake.current(); }} />
            <button type="button" aria-pressed={sweep && !reducedMotion && engine !== "fallback"} disabled={reducedMotion || engine === "fallback"}
              onClick={() => setSweep(!sweep)} aria-label="光の自動移動">{sweep && !reducedMotion ? "Ⅱ" : "▷"}<span>AUTO LIGHT</span></button>
          </div>
          <p className={s.hint}>{engine === "fallback" ? "静止プレビューを表示しています。選択した内容は予約へ引き継げます。" : compact ? "スライダーで光を動かし、ツヤの違いを比べてください。" : "髪の上でカーソルを動かすと、光が表面をすべります。"}</p>
        </div>
        <div className={s.controls}>
          <p className={s.controlTitle}>MAKE IT YOURS<span>01 — 03</span></p>
          {([
            ["style", "STYLE", "かたち", materialStyles],
            ["color", "COLOR", "カラー", materialColors],
            ["texture", "TEXTURE", "質感", materialTextures],
          ] as const).map(([key, label, jp, options], index) => (
            <fieldset key={key} className={s.group}>
              <legend><span className={s.number}>0{index + 1}</span>{label}<span className={s.jp}>{jp}</span></legend>
              <div className={s.options} data-kind={key}>
                {options.map((option) => (
                  <label key={option} className={s.option} data-selected={selection[key] === option}>
                    <input type="radio" name={`${id}-${key}`} value={option} checked={selection[key] === option} onChange={() => choose(key, option)} />
                    {key === "color" && <span className={s.swatch} style={{ "--swatch": materialPalette[option as HairMaterialSelection["color"]] } as CSSProperties} aria-hidden="true" />}
                    <span>{option.toUpperCase()}</span>
                    {key !== "color" && <span className={s.optionMark} aria-hidden="true">{selection[key] === option ? "−" : "+"}</span>}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <p className={s.textureDescription} aria-live="polite">{textureProfiles[selection.texture].description}</p>
          <div className={s.summary} aria-live="polite"><span>YOUR MATERIAL</span><p>{selection.style.toUpperCase()} / {selection.color.toUpperCase()} / {selection.texture.toUpperCase()}</p></div>
          <a className={s.book} href={bookingHref(selection)} onClick={(event) => {
            if (onBook && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); onBook({ ...selection }); }
          }}>BOOK THIS STYLE <span aria-hidden="true">↗</span></a>
          <p className={s.bookingHint}>この組み合わせを予約・相談へ</p>
        </div>
      </div>
      <footer className={s.footer}><span>SHAPE. TONE. FEEL.</span><p>質感・色のイメージです。仕上がりは髪の状態や施術で異なります。</p></footer>
    </section>
  );
}
