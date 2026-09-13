"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { go } from "@/lib/navigation";
import { SafeImage } from "../ui/SafeImage";
import { revealStyles, revealTones } from "./model";
import { useRevealSelection } from "./useRevealSelection";
import s from "./HairColorParticleReveal.module.css";

export function HairColorRevealEntry() {
  const selection = useRevealSelection();
  const asset = revealStyles[selection.style];
  const tone = revealTones[selection.color];
  const enter = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go("reveal");
  };
  return <section className={s.entry} aria-labelledby="color-reveal-entry-title" data-testid="color-reveal-entry">
    <div className={s.entryCopy}>
      <p className={s.eyebrow}>NŌIR / INTERACTIVE COLOR EXPERIENCE</p>
      <h2 id="color-reveal-entry-title">COLOR,<br /><em>IN MOTION.</em></h2>
      <p>髪色がほどけ、光の中で新しい表情へ。<br />5つのカラーを、あなたの感性で。</p>
      <Link href="/color-reveal" onClick={enter}>ENTER THE COLOR EXPERIENCE <span aria-hidden="true">↗</span></Link>
    </div>
    <Link className={s.entryVisual} href="/color-reveal" onClick={enter} aria-label="Hair Color Particle Revealを体験する">
      <SafeImage src={asset.photo} alt={`${asset.name} / ${selection.color.toUpperCase()}`} fill sizes="(max-width: 700px) 88vw, 42vw" />
      <span className={s.entryTint} style={{ backgroundColor: tone.swatch,
        opacity: selection.color === "beige" ? .10 : selection.color === "black" ? .86 : selection.color === "silver" ? .20 : .48,
        mixBlendMode: selection.color === "silver" ? "screen" : "multiply",
        maskImage: `url(${asset.mask})`, WebkitMaskImage: `url(${asset.mask})`, maskMode: "luminance",
      }} />
      <span className={s.entryMeta} aria-hidden="true"><span>YOUR LAST COLOR</span><strong>{selection.color.toUpperCase()}</strong></span>
    </Link>
  </section>;
}
