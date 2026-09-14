"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReducedData } from "@/hooks/useReducedData";
import { SafeImage } from "../ui/SafeImage";
import { revealBookingPath, revealColors, revealStyles, revealTones, type RevealSelection } from "./model";
import { setRevealSelection, useRevealSelection } from "./useRevealSelection";
import s from "./HairColorParticleReveal.module.css";

const RevealCanvas = dynamic(() => import("@/three/HairColorParticleReveal/RevealCanvas"), { ssr: false });
const deviceQuery = "(pointer: coarse), (max-width: 767px)";
const subscribeDevice = (notify: () => void) => {
  const media = matchMedia(deviceQuery); media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
export type HairColorParticleRevealProps = {
  active?: boolean;
  onBook?: (selection: RevealSelection) => void;
};
export function HairColorParticleReveal({ active = true, onBook }: HairColorParticleRevealProps) {
  const selection = useRevealSelection(), id = useId();
  const asset = revealStyles[selection.style], tone = revealTones[selection.color];
  const stage = useRef<HTMLDivElement>(null), pointer = useRef({ x: 10, y: 10 });
  const [nearby, setNearby] = useState(false), [visible, setVisible] = useState(false), [pageVisible, setPageVisible] = useState(true);
  const [failed, setFailed] = useState(false), [ready, setReady] = useState({ key: "", engine: "loading" });
  const compactDevice = useSyncExternalStore(subscribeDevice, () => matchMedia(deviceQuery).matches, () => true);
  const reducedData = useReducedData(), reducedMotion = useReducedMotion();
  const compact = compactDevice || reducedData, canvasKey = `${selection.style}-${compact}`;
  const onReady = useCallback((engine: "webgpu" | "webgl") => setReady({ key: canvasKey, engine }), [canvasKey]);
  const onFailure = useCallback(() => setFailed(true), []);
  const live = ready.key === canvasKey && !failed;
  const engine = failed ? "fallback" : live ? ready.engine : "loading";
  const animate = !reducedMotion;
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const near = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNearby(true); }, { rootMargin: "250px" });
    // Observe the full workspace so mobile color controls can animate the photo
    // even when the image's lower edge is just outside the viewport.
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    near.observe(node); observer.observe(node.parentElement!);
    const visibility = () => setPageVisible(!document.hidden);
    visibility(); document.addEventListener("visibilitychange", visibility);
    return () => { near.disconnect(); observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  return <section id="hair-color-particle-reveal" className={s.section} aria-label="Hair Color Particle Reveal"
    data-testid="hair-color-particle-reveal" data-engine={engine} data-style={selection.style} data-color={selection.color}>
    <header className={s.heading}>
      <div><p className={s.eyebrow}>NŌIR / COLOR</p><h2>FIND YOUR<br /><em>COLOR.</em></h2></div>
    </header>
    <div className={s.workspace}>
      <div ref={stage} className={s.stage} role="img" aria-label={`${asset.name} / ${selection.color.toUpperCase()} のヘアカラープレビュー`}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          pointer.current.x = (event.clientX - rect.left) / rect.width * 2 - 1;
          pointer.current.y = (1 - (event.clientY - rect.top) / rect.height) * 3 - 1.5;
        }} onPointerLeave={() => { pointer.current.x = 10; pointer.current.y = 10; }}
        onPointerCancel={() => { pointer.current.x = 10; pointer.current.y = 10; }}>
        <div className={s.fallback} style={{ opacity: live ? 0 : 1 }}>
          <SafeImage src={compact ? asset.mobilePhoto : asset.photo} alt="" fill sizes="(max-width: 700px) 88vw, 460px" unoptimized />
          <div className={s.staticTint} style={{ backgroundColor: tone.swatch,
            opacity: selection.color === "beige" ? .10 : selection.color === "black" ? .86 : selection.color === "silver" ? .20 : .48,
            mixBlendMode: selection.color === "silver" ? "screen" : "multiply",
            maskImage: `url(${compact ? asset.mobileMask : asset.mask})`, WebkitMaskImage: `url(${compact ? asset.mobileMask : asset.mask})`, maskMode: "luminance",
          }} />
        </div>
        {nearby && !failed && <RevealCanvas key={canvasKey} selection={selection} compact={compact} active={active && visible && pageVisible}
          motion={animate} replay={0} pointer={pointer} onReady={onReady} onFailure={onFailure} />}
        <div className={s.photoBottom} aria-hidden="true"><span>{asset.name}</span><strong>{selection.color.toUpperCase()}</strong></div>
      </div>
      <div className={s.controls}>
        <fieldset className={s.colorGroup}>
          <legend>髪色を選ぶ</legend>
          <div className={s.colors}>{revealColors.map((color) => <label key={color} className={s.color} data-selected={selection.color === color}>
            <input type="radio" name={`${id}-color`} value={color} checked={selection.color === color} onChange={() => setRevealSelection({ ...selection, color })} />
            <span className={s.swatch} style={{ "--tone": revealTones[color].swatch } as CSSProperties} aria-hidden="true" />
            <span className={s.colorName}>{color.toUpperCase()}</span>
          </label>)}</div>
          <p className={s.description} aria-live="polite">{tone.description}</p>
        </fieldset>
        <a className={s.book} href={revealBookingPath(selection)} onClick={(event) => {
          if (onBook && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault(); onBook({ ...selection });
          }
        }}>BOOK THIS COLOR <span aria-hidden="true">↗</span></a>
        <p className={s.bookingHint}>仕上がりは髪の状態により異なります。</p>
      </div>
    </div>
  </section>;
}
