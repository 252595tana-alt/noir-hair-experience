"use client";
import { site } from "@/config/site";
import { SafeImage as Image } from "../ui/SafeImage";
import { go } from "@/lib/navigation";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
export function Concept() {
  return (
    <section className={s.concept}>
      <div className={s.conceptPhoto}>
        <Image
          src="/images/hero.png"
          alt={`${site.name}のヘアデザインを表現するモデル`}
          fill
          sizes="(max-width:700px) 100vw, 50vw"
        />
      </div>
      <div className={s.conceptText}>
        <span className={s.eyebrow}>01 / OUR PHILOSOPHY</span>
        <h1>
          MORE THAN
          <br />
          <em>JUST HAIR.</em>
        </h1>
        <h2>髪は、あなたを語る。</h2>
        <p>
          誰かの正解より、自分の感性を。
          <br />
          {site.name}は、一人ひとりの個性と向き合う
          <br />
          ヘアデザインスタジオです。
        </p>
        <p>
          触れて、試して、心が動くスタイルを見つける。
          <br />
          その小さな選択が、新しい日常のはじまりに。
        </p>
        <button className={s.primaryButton} onClick={() => go("style")}>
          FIND YOUR EXPRESSION <Arrow />
        </button>
      </div>
    </section>
  );
}
