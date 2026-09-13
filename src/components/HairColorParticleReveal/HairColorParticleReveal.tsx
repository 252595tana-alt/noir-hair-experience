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
  const [motion, setMotion] = useState(true), [replay, setReplay] = useState(0);
  const compactDevice = useSyncExternalStore(subscribeDevice, () => matchMedia(deviceQuery).matches, () => true);
  const reducedData = useReducedData(), reducedMotion = useReducedMotion();
  const compact = compactDevice || reducedData, canvasKey = `${selection.style}-${compact}`;
  const onReady = useCallback((engine: "webgpu" | "webgl") => setReady({ key: canvasKey, engine }), [canvasKey]);
  const onFailure = useCallback(() => setFailed(true), []);
  const live = ready.key === canvasKey && !failed;
  const engine = failed ? "fallback" : live ? ready.engine : "loading";
  const animate = motion && !reducedMotion;
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
      <div><p className={s.eyebrow}>NŌIR / HAIR COLOR PARTICLE REVEAL</p><h2>COLOR,<br /><em>IN MOTION.</em></h2></div>
      <p className={s.intro}>色がほどける。私が変わる。<br />あなたの色を、ここで見つけて。</p>
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
          motion={animate} replay={replay} pointer={pointer} onReady={onReady} onFailure={onFailure} />}
        <div className={s.photoTop} aria-hidden="true"><span>THE COLOR STUDY</span><span>0{revealColors.indexOf(selection.color) + 1} / 05</span></div>
        <div className={s.photoBottom} aria-hidden="true"><span>{asset.name}</span><strong>{selection.color.toUpperCase()}</strong></div>
      </div>
      <div className={s.controls}>
        <p className={s.eyebrow}>ONE STYLE. FIVE EXPRESSIONS.</p>
        <div className={s.styleInfo}><span>SELECTED STYLE</span><h3>{asset.name}</h3><p>{asset.description}</p></div>
        <fieldset className={s.colorGroup}>
          <legend>CHOOSE YOUR COLOR <span>髪色を選ぶ</span></legend>
          <div className={s.colors}>{revealColors.map((color, index) => <label key={color} className={s.color} data-selected={selection.color === color}>
            <input type="radio" name={`${id}-color`} value={color} checked={selection.color === color} onChange={() => setRevealSelection({ ...selection, color })} />
            <span className={s.swatch} style={{ "--tone": revealTones[color].swatch } as CSSProperties} aria-hidden="true" />
            <span className={s.colorName}>{color.toUpperCase()}</span><span className={s.colorIndex} aria-hidden="true">0{index + 1}</span>
            <span className={s.check} aria-hidden="true">{selection.color === color ? "✓" : "+"}</span>
          </label>)}</div>
          <p className={s.description} aria-live="polite">{tone.description}</p>
        </fieldset>
        <div className={s.motionRow}>
          <button type="button" aria-label="カラーの粒子アニメーション" aria-pressed={animate} disabled={reducedMotion || failed}
            onClick={() => setMotion(!motion)}>COLOR IN MOTION <span>{animate ? "ON ●" : "OFF ○"}</span></button>
          <button type="button" className={s.replay} disabled={!animate || !live} onClick={() => setReplay(replay + 1)} aria-label="粒子アニメーションをもう一度見る">REPLAY ↻</button>
        </div>
        <p className={s.motionHint}>{failed ? "静止写真でカラーを比較できます。選択は予約へ引き継がれます。" : reducedMotion ? "動きを抑えて表示しています。5つのカラーを比較できます。" : "色を選ぶと、細かな色素が毛流れに沿ってほどけます。"}</p>
        <div className={s.selection} aria-live="polite"><span>YOUR SELECTION</span><p>{asset.name} <span>/</span> {selection.color.toUpperCase()}</p></div>
        <a className={s.book} href={revealBookingPath(selection)} onClick={(event) => {
          if (onBook && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault(); onBook({ ...selection });
          }
        }}>BOOK THIS COLOR <span aria-hidden="true">↗</span></a>
        <p className={s.bookingHint}>このスタイルとカラーで予約・相談する</p>
      </div>
    </div>
    <footer className={s.footer}><span>A QUIET CHANGE. A NEW EXPRESSION.</span><p>カラーの仕上がりイメージです。実際の発色は髪の状態や施術によって異なります。</p></footer>
  </section>;
}
