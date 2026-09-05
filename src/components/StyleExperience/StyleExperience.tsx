"use client";
import { SafeImage as Image } from "../ui/SafeImage";
import { useRef, useState, type PointerEvent } from "react";
import { styles } from "@/data/styles";
import { stylistById } from "@/data/stylists";
import { colorById } from "@/data/hairStyles";
import { useSiteStore } from "@/store/useSiteStore";
import { go } from "@/lib/navigation";
import { useMotion } from "@/lib/useMotion";
import { HairViewer } from "../HairViewer/HairViewer";
import { HairColorSelector } from "../HairColorSelector/HairColorSelector";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
import { StyleFlow } from "@/three/StyleFlow";
export function StyleExperience({
  colorMode = false,
}: {
  colorMode?: boolean;
}) {
  const selected = useSiteStore((state) => state.selectedStyleId);
  const viewerOpen = useSiteStore((state) => state.viewerOpen);
  const color = useSiteStore((state) => state.selectedColor);
  const index = Math.max(
    0,
    styles.findIndex((item) => item.id === selected),
  );
  const style = styles[index];
  const [flow, setFlow] = useState({ from: "", to: "", direction: 1, id: 0 });
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, style.id, "style");
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const change = (delta: number) => {
    const next = styles[(index + delta + styles.length) % styles.length];
    setFlow((previous) => ({
      from: style.heroImage,
      to: next.heroImage,
      direction: delta,
      id: previous.id + 1,
    }));
    useSiteStore.getState().setStyle(next.id);
    go("style", `/style/${next.slug}`);
  };
  const end = (e: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x,
      dy = e.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy))
      change(dx < 0 ? 1 : -1);
  };
  return (
    <section className={s.experienceStage} aria-labelledby="experience-title">
      <div className={s.sectionIntro}>
        <span className={s.eyebrow}>
          {colorMode ? "03 / COLOR LAB" : "02 / STYLE COLLECTION"}
        </span>
        <h1 id="experience-title">
          {colorMode ? (
            <>
              A NEW
              <br />
              <em>SHADE OF YOU.</em>
            </>
          ) : (
            <>
              FIND YOUR
              <br />
              <em>OWN EXPRESSION.</em>
            </>
          )}
        </h1>
        <p>
          {colorMode
            ? "色で出会う、もうひとりの自分。"
            : "その髪に、あなたの意志を。"}
        </p>
        <span className={s.verticalNote}>
          {colorMode ? "COLOR IS A FEELING." : "DESIGNED AROUND YOU."}
        </span>
      </div>
      <div className={s.modelStage}>
        {colorMode || viewerOpen ? (
          <HairViewer />
        ) : (
          <div
            className={s.stylePhoto}
            data-cursor="DRAG"
            tabIndex={0}
            role="group"
            aria-label="スタイルを左右スワイプまたは矢印キーで切替"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                change(e.key === "ArrowLeft" ? -1 : 1);
              }
            }}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse" && e.button !== 0) return;
              gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerUp={end}
            onPointerCancel={() => {
              gesture.current = null;
            }}
          >
            <div ref={ref} className={s.frame}>
              <Image
                src={style.heroImage}
                alt={`${style.name} ヘアスタイル`}
                fill
                priority
                unoptimized
                draggable={false}
                sizes="(max-width:700px) 100vw, 50vw"
                style={{
                  objectPosition: style.position,
                  objectFit: "cover",
                }}
              />
            </div>
            {flow.to === style.heroImage && (
              <StyleFlow
                key={flow.id}
                from={flow.from}
                to={flow.to}
                direction={flow.direction}
              />
            )}
            <span className={s.dragHint}>
              ← &nbsp; SWIPE TO EXPLORE &nbsp; →
            </span>
          </div>
        )}
        {!colorMode && (
          <div className={s.styleControls}>
            <button onClick={() => change(-1)} aria-label="前のスタイル">
              <Arrow direction="left" />
            </button>
            <div>
              <span className={s.eyebrow}>
                STYLE {String(index + 1).padStart(2, "0")} / 08
              </span>
              <h2>{style.name}</h2>
            </div>
            <button onClick={() => change(1)} aria-label="次のスタイル">
              <Arrow />
            </button>
          </div>
        )}
      </div>
      <div className={s.styleAside}>
        {colorMode ? (
          <>
            <span className={s.eyebrow}>YOUR COLOR, EVERY ANGLE.</span>
            <h2>
              LESS RULES.
              <br />
              MORE YOU.
            </h2>
            <p>
              気になる色を、あらゆる角度から。
              <br />
              ドラッグで回転して、表情の違いを。
            </p>
            <HairColorSelector />
            <p className={s.finePrint}>
              カラーはイメージです。髪質や履歴に合わせて、カウンセリングで仕上がりをご提案します。
            </p>
          </>
        ) : (
          <>
            <span className={s.eyebrow}>THE DETAIL</span>
            <h2>
              {style.name}
              <br />
              <span>COLLECTION</span>
            </h2>
            <p>{style.detail}</p>
            <p className={s.finePrint}>
              ¥{style.estimatedPriceFrom.toLocaleString("ja-JP")}〜 /{" "}
              {style.estimatedTimeMin}–{style.estimatedTimeMax}{" "}
              MIN（指名料別・参考）
            </p>
            <span className={s.styleTags}>{style.tags}</span>
            <div className={s.viewTabs}>
              <button
                onClick={() => {
                  useSiteStore.getState().setStyle(style.id);
                  useSiteStore.getState().setViewerOpen(!viewerOpen);
                }}
                aria-pressed={viewerOpen}
              >
                {viewerOpen ? "PHOTO VIEW" : "360° VIEW"} <span>↔</span>
              </button>
              <button
                onClick={() => {
                  useSiteStore.getState().setStyle(style.id);
                  go("color");
                }}
              >
                TRY COLOR <Arrow direction="up" />
              </button>
            </div>
          </>
        )}
        <div className={s.styleConnection}>
          <div>
            <span className={s.eyebrow}>
              {colorMode ? "YOUR STYLE" : "SELECTED COLOR"}
            </span>
            <p>{colorMode ? style.name : colorById(color).name}</p>
            {colorMode && (
              <button onClick={() => go("style")}>BACK TO STYLE ↗</button>
            )}
          </div>
          <div>
            <span className={s.eyebrow}>STYLIST</span>
            <p>{stylistById(style.stylistId)?.name ?? "サロンに相談"}</p>
            <button
              onClick={() => {
                useSiteStore.getState().setStyle(style.id);
                useSiteStore.getState().setStylist(style.stylistId);
                go("stylist");
              }}
            >
              VIEW STYLIST ↗
            </button>
          </div>
        </div>
        <button
          className={s.primaryButton}
          onClick={() => {
            useSiteStore.getState().setStyle(style.id);
            go("booking");
          }}
        >
          BOOK THIS LOOK <Arrow />
        </button>
        <button className={s.textButton} onClick={() => go("menu")}>
          MENU & PRICE <Arrow direction="up" />
        </button>
      </div>
    </section>
  );
}
