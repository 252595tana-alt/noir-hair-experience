"use client";
import { useSiteStore } from "@/store/useSiteStore";
import { menus, yen } from "@/data/menu";
import { go } from "@/lib/navigation";
import { PlanSummary } from "./PlanSummary";
import { ResetSelection } from "../ResetSelection/ResetSelection";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
export function MenuPlan() {
  const selected = useSiteStore((state) => state.selectedMenus);
  const recommended = useSiteStore((state) => state.recommendedMenus);
  return (
    <section className={s.contentPage} aria-labelledby="menu-title">
      <div className={s.pageHeading}>
        <span className={s.eyebrow}>05 / MENU & PRICE</span>
        <h1 id="menu-title">
          MAKE IT <em>YOURS.</em>
        </h1>
        <p>あなたの「なりたい」を、ひとつのプランに。</p>
      </div>
      <div className={s.menuLayout}>
        <div>
          <div className={s.listHeading}>
            <span>RECOMMENDED FOR YOUR STYLE</span>
            <span>PRICE / TAX IN</span>
          </div>
          <div aria-label="Recommended Menu">
            {menus
              .filter((item) => recommended.includes(item.id))
              .map((item) => (
                <div className={s.menuRow} key={item.id}>
                  <span className={s.checkBox}>✓</span>
                  <span className={s.menuName}>
                    {item.name}
                    <small>{item.ja} / RECOMMENDED</small>
                  </span>
                  <span>{yen(item.priceFrom)}〜</span>
                </div>
              ))}
          </div>
          {!recommended.length && (
            <p className={s.finePrint}>
              スタイル・カラーを選ぶとおすすめの施術が反映されます。
            </p>
          )}
          <p className={s.finePrint}>
            おすすめは選択中のスタイル・カラーに連動します。変更する場合はSTYLE
            / COLORからお選びください。
          </p>
          <div className={s.listHeading}>
            <span>OPTIONAL MENU</span>
            <span>ADD YOUR CARE</span>
          </div>
          <div aria-label="Optional Menu">
            {menus
              .filter((item) => !recommended.includes(item.id))
              .map((item) => (
                <button
                  key={item.id}
                  className={s.menuRow}
                  aria-label={"OPTION " + item.name}
                  aria-pressed={selected.includes(item.id)}
                  onClick={() => useSiteStore.getState().toggleMenu(item.id)}
                >
                  <span className={s.checkBox}>
                    {selected.includes(item.id) ? "✓" : "＋"}
                  </span>
                  <span className={s.menuName}>
                    {item.name}
                    <small>{item.ja}</small>
                  </span>
                  <span>{yen(item.priceFrom)}〜</span>
                </button>
              ))}
          </div>
          <p className={s.finePrint}>
            表示は仮料金・概算時間です。髪の長さや履歴によって変動し、正式な予約枠ではありません。
          </p>
          <ResetSelection />
        </div>
        <aside className={s.planPanel}>
          <span className={s.eyebrow}>YOUR PLAN</span>
          <h2>
            A LOOK.
            <br />
            ONLY YOU.
          </h2>
          <PlanSummary />
          <button className={s.primaryButton} onClick={() => go("booking")}>
            CONTINUE TO BOOK <Arrow />
          </button>
        </aside>
      </div>
    </section>
  );
}
