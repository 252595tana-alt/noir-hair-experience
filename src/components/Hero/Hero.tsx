"use client";
import { site } from "@/config/site";
import { SafeImage as Image } from "../ui/SafeImage";
import { go } from "@/lib/navigation";
import { useSiteStore } from "@/store/useSiteStore";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
import { HeroEffects } from "@/three/HeroEffects";
export function Hero() {
  return (
    <section className={s.hero} aria-labelledby="hero-heading">
      <div className={s.heroPhoto} data-hero-photo>
        <Image
          src="/images/hero.png"
          alt="風になびくロングレイヤーヘアのモデル"
          fill
          priority
          sizes="(max-width: 700px) 100vw, 58vw"
          className={s.heroImage}
        />
      </div>
      <HeroEffects />
      <div className={s.heroEdition}>
        <span>THE {site.name} EDIT</span>
        <span>COLLECTION / 01</span>
      </div>
      <div className={s.heroTitle}>
        <span className={s.eyebrow}>BE UNMISTAKABLY YOU.</span>
        <h1 id="hero-heading">
          HAIR IS
          <br />
          <span>IDENTITY.</span>
        </h1>
        <p>自分らしさは、髪からはじまる。</p>
        <button className={s.heroExplore} onClick={() => go("style")}>
          EXPLORE YOUR STYLE{" "}
          <span className={s.circleArrow}>
            <Arrow />
          </span>
        </button>
      </div>
      <div className={s.heroCaption}>
        <span className={s.captionLine} />
        <p>
          FIND YOUR STYLE.
          <br />
          FIND YOUR COLOR.
        </p>
        <span>ひとつの髪から、無限の表現へ。</span>
      </div>
      <button
        className={s.hero360}
        onClick={() => {
          useSiteStore.getState().setViewerOpen(true);
          go("style");
        }}
      >
        <span className={s.orbit}>360°</span>
        <span>
          CHANGE YOUR
          <br />
          PERSPECTIVE <Arrow direction="up" />
        </span>
      </button>
      <div className={s.heroBottom}>
        <span>HAIR / ART / INDIVIDUALITY</span>
        <span className={s.scrollHint}>
          INTERACTIVE HAIR EXPERIENCE <span>↔</span>
        </span>
        <span>EST. 2026</span>
      </div>
    </section>
  );
}
