"use client";
import { go, openSalon } from "@/lib/navigation";
import { useSiteStore } from "@/store/useSiteStore";
import type { SiteMode } from "@/lib/constants";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
import { prefetchMode } from "@/lib/modeModules";
import { site } from "@/config/site";
const items: { mode: SiteMode; label: string; number: string }[] = [
  { mode: "style", label: "STYLE", number: "02" },
  { mode: "color", label: "COLOR", number: "03" },
  { mode: "stylist", label: "STYLIST", number: "04" },
  { mode: "menu", label: "MENU", number: "05" },
];
export function Navigation() {
  const mode = useSiteStore((state) => state.mode);
  return (
    <>
      <header className={s.header} data-home={mode === "home"}>
        <button
          className={s.logo}
          onClick={() => go("home")}
          aria-label={`${site.name} ホーム`}
        >
          {site.name}
          <span>HAIR DESIGN STUDIO</span>
        </button>
        <span className={s.headerNote}>
          TOKYO, JAPAN
          <br />
          YOUR HAIR. YOUR EXPRESSION.
        </span>
        <button
          className={s.salonLink}
          onClick={openSalon}
          onPointerEnter={() => prefetchMode("salon")}
          onFocus={() => prefetchMode("salon")}
        >
          <span className={s.tiny}>07</span> SALON / ACCESS{" "}
          <Arrow direction="up" />
        </button>
      </header>
      <nav className={s.desktopNav} data-home={mode === "home"} aria-label="メインナビゲーション">
        {items.map((item) => (
          <button
            key={item.mode}
            onClick={() => go(item.mode)}
            onPointerEnter={() => prefetchMode(item.mode)}
            onFocus={() => prefetchMode(item.mode)}
            aria-current={mode === item.mode ? "page" : undefined}
            className={mode === item.mode ? s.navActive : ""}
          >
            <span className={s.tiny}>{item.number}</span>
            {item.label}
            <span className={s.navMark}>↗</span>
          </button>
        ))}
        <button
          className={s.navBook}
          aria-current={mode === "booking" ? "page" : undefined}
          onClick={() => go("booking")}
          onPointerEnter={() => prefetchMode("booking")}
          onFocus={() => prefetchMode("booking")}
        >
          <span className={s.tiny}>06</span>BOOK <Arrow />
        </button>
      </nav>
      {mode !== "home" && <div className={s.worldRail}>
        <span className={s.liveDot} />
        <span>01 / WORLD</span>
        <span className={s.railLine} />
        <button onClick={() => go("concept")}>OUR PHILOSOPHY</button>
      </div>}
    </>
  );
}

