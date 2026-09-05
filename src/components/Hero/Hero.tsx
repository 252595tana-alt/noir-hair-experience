"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { go } from "@/lib/navigation";
import { useSiteStore } from "@/store/useSiteStore";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
import { HeroEffects } from "@/three/HeroEffects";
import { HeroTurntable } from "./HeroTurntable";
export function Hero() {
  const angle = useSiteStore((state) => state.selectedAngle);
  const hasRotated = useSiteStore((state) => state.hasRotated);
  const section = useRef<HTMLElement>(null);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    const hero = section.current;
    if (!hero) return;
    const sync = () => setInteractive(hero.dataset.intro === "rest");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(hero, { attributes: true, attributeFilter: ["data-intro"] });
    return () => observer.disconnect();
  }, []);
  const displayAngle = interactive ? angle : 0;
  return (
    <section ref={section} className={`${s.hero} ${s.quietHero}`} aria-labelledby="hero-heading" data-intro="pending">
      <div className={s.heroAura} aria-hidden="true" />
      <div className={s.heroPhoto} data-hero-photo>
        <HeroTurntable interactive={interactive} />
      </div>
      <noscript><style>{'[data-hero-photo] { opacity: 1 !important; animation: none !important; }'}</style></noscript>
      <HeroEffects />
      <div className={s.heroMist} aria-hidden="true" />
      <div className={s.heroTitle}>
        <h1 id="hero-heading">BE YOU.</h1>
        <button className={s.heroExplore} aria-label="EXPLORE YOUR STYLE" onClick={() => go("style")}>
          EXPLORE <span className={s.circleArrow}><Arrow /></span>
        </button>
      </div>
      <button
        className={s.hero360}
        aria-label="人物を次の角度へ45度回転"
        disabled={!interactive}
        onClick={() => {
          const state = useSiteStore.getState();
          state.setAngle(state.selectedAngle + 1);
          state.markRotated();
        }}
      >
        <span className={s.orbit} style={{ "--hero-angle": `${displayAngle * 45}deg` } as CSSProperties}>360°</span>
        <span>{hasRotated && interactive ? `${String(angle + 1).padStart(2, "0")} / 08` : "DRAG TO ROTATE"}</span>
      </button>
    </section>
  );
}
