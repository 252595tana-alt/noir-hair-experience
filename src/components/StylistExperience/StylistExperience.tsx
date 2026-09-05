"use client";
import { site } from "@/config/site";
import { useState } from "react";
import { stylists, stylistById } from "@/data/stylists";
import { styles } from "@/data/styles";
import { useSiteStore } from "@/store/useSiteStore";
import { go } from "@/lib/navigation";
import { yen } from "@/data/menu";
import { SafeImage } from "../ui/SafeImage";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
export function StylistExperience() {
  const selected = useSiteStore((state) => state.selectedStylistId);
  const active = stylistById(selected) ?? stylists[0];
  const [notice, setNotice] = useState("");
  const works = styles.filter((style) => active.styleIds.includes(style.id));
  return (
    <section className={s.contentPage} aria-labelledby="stylist-title">
      <div className={s.pageHeading}>
        <span className={s.eyebrow}>04 / THE PEOPLE BEHIND YOUR HAIR</span>
        <h1 id="stylist-title">
          GOOD HAIR.
          <br />
          <em>GREAT PEOPLE.</em>
        </h1>
        <p>感性を重ねて、あなただけのデザインへ。</p>
      </div>
      <div className={s.stylists}>
        {stylists.map((stylist, index) => (
          <article
            className={s.stylist}
            key={stylist.id}
            data-selected={selected === stylist.id}
          >
            <div className={s.stylistPortrait}>
              <SafeImage
                src={stylist.image}
                alt={stylist.name + " / デモプロフィール"}
                fill
                unoptimized
                sizes="(max-width:700px) 35vw, 20vw"
              />
              <span className={s.stylistNumber}>0{index + 1}</span>
              <span className={s.stylistSignature}>
                {stylist.name.toLowerCase()}.
              </span>
              <span className={s.portraitLabel}>{site.name} / CREATIVE TEAM</span>
            </div>
            <div className={s.stylistName}>
              <h2>{stylist.name}</h2>
              <span>
                {selected === stylist.id ? "✓ SELECTED" : stylist.role}
              </span>
            </div>
            <p>
              {stylist.specialties.join(" / ")}
              <br />
              指名料 {yen(stylist.nominationFee ?? 0)}
            </p>
            <div className={s.stylistLinks}>
              <button
                aria-label={stylist.name + "の作品を見る"}
                aria-pressed={selected === stylist.id}
                onClick={() => {
                  useSiteStore.getState().setStylist(stylist.id);
                  go("stylist");
                }}
              >
                VIEW WORKS <Arrow direction="up" />
              </button>
              {stylist.instagram ? (
                <a href={stylist.instagram} target="_blank" rel="noreferrer">
                  INSTAGRAM ↗
                </a>
              ) : (
                <button
                  aria-label={stylist.name + " Instagram"}
                  onClick={() =>
                    setNotice(stylist.name + "のInstagramは準備中です。")
                  }
                >
                  INSTAGRAM ↗
                </button>
              )}
            </div>
            <button
              className={s.outlineButton}
              onClick={() => {
                useSiteStore.getState().setStylist(stylist.id);
                go("booking");
              }}
            >
              BOOK {stylist.name} <Arrow />
            </button>
          </article>
        ))}
      </div>
      <section className={s.worksSection} aria-labelledby="works-title">
        <div className={s.worksHeading}>
          <h2 id="works-title">{active.name}’S WORKS</h2>
          <span>{works.length} STYLES</span>
        </div>
        <div className={s.worksGrid}>
          {works.map((style) => (
            <button
              key={style.id}
              className={s.workCard}
              onClick={() => {
                useSiteStore.getState().setStyle(style.id);
                go("style");
              }}
              aria-label={style.name + "のスタイルを選択"}
            >
              <div>
                <SafeImage
                  src={style.heroImage}
                  alt={style.name + " ヘアスタイル"}
                  fill
                  unoptimized
                  sizes="(max-width:700px) 40vw, 20vw"
                />
              </div>
              <span>{style.name} ↗</span>
            </button>
          ))}
        </div>
        {!works.length && <p>作品は準備中です。</p>}
      </section>
      <p role="status" className={s.notice}>
        {notice || "デモスタッフ・紹介情報です。"}
      </p>
      <button className={s.textButton} onClick={() => go("menu")}>
        MENU & YOUR PLAN <Arrow />
      </button>
    </section>
  );
}
