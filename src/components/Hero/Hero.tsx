"use client";
import { SafeImage as Image } from "../ui/SafeImage";
import { go } from "@/lib/navigation";
import { useSiteStore } from "@/store/useSiteStore";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
import { HeroEffects } from "@/three/HeroEffects";
export function Hero() {
  return (
    <section className={`${s.hero} ${s.quietHero}`} aria-labelledby="hero-heading">
      <div className={s.heroAura} aria-hidden="true" />
      <div className={s.heroPhoto} data-hero-photo>
        <Image src="/images/hero.png" alt="風になびくロングレイヤーヘアのモデル" fill priority sizes="(max-width: 700px) 100vw, 68vw" className={s.heroImage} />
      </div>
      <HeroEffects />
      <div className={s.heroMist} aria-hidden="true" />
      <div className={s.heroTitle}>
        <h1 id="hero-heading">BE YOU.</h1>
        <button className={s.heroExplore} aria-label="EXPLORE YOUR STYLE" onClick={() => go("style")}>
          EXPLORE <span className={s.circleArrow}><Arrow /></span>
        </button>
      </div>
      <button className={s.hero360} aria-label="360° CHANGE YOUR PERSPECTIVE" onClick={() => {
        useSiteStore.getState().setViewerOpen(true);
        go("style");
      }}><span className={s.orbit}>360°</span></button>
    </section>
  );
}
