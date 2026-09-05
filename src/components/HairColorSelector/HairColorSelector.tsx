"use client";
import { useEffect } from "react";
import { hairColors, hairStyles, colorById } from "@/data/hairStyles";
import { styleById } from "@/data/styles";
import { useSiteStore } from "@/store/useSiteStore";
import { preloadImages } from "@/lib/preload";
import s from "../experience.module.css";
import { usePreviewStore, useTryColor } from "@/three/previewStore";
export function HairColorSelector() {
  const candidate = useTryColor();
  const color = useSiteStore((state) => state.selectedColor),
    angle = useSiteStore((state) => state.selectedAngle),
    styleId = useSiteStore((state) => state.selectedStyleId);
  const style = styleById(styleId);
  const available = style?.availableColors ?? hairColors.map((item) => item.id);
  const frames = style?.hairImages ?? hairStyles;
  useEffect(() => {
    const index = available.indexOf(color);
    const next = available[(index + 1) % available.length];
    const src = frames[next]?.[angle];
    if (src) preloadImages([src]);
  }, [color, angle, available, frames]);
  return (
    <div className={s.colorSelector}>
      <div className={s.colorLabel}>
        <span className={s.eyebrow}>SELECT YOUR COLOR</span>
        <span>{String(available.length).padStart(2, "0")} SHADES</span>
      </div>
      <div className={s.swatches} role="group" aria-label="ヘアカラー">
        {hairColors.map((item) => {
          const enabled = available.includes(item.id);
          return (
            <button
              key={item.id}
              style={{ "--swatch": item.hex } as React.CSSProperties}
              onClick={() => usePreviewStore.getState().tryColor(item.id)}
              data-cursor="TRY"
              disabled={!enabled}
              aria-label={item.name}
              title={enabled ? item.name : "このスタイルでは利用できません"}
              aria-pressed={enabled && candidate === item.id}
            >
              <span />
              {!enabled ? <i>×</i> : candidate === item.id ? <i>✓</i> : null}
            </button>
          );
        })}
      </div>
      <div className={s.colorName} aria-live="polite">
        <span>TRY {colorById(candidate).name}</span>
        <span>{colorById(candidate).ja}</span>
      </div>
      <p className={s.finePrint}>CURRENT / {colorById(color).name}</p>
      <button
        className={s.primaryButton}
        disabled={candidate === color}
        onClick={() => usePreviewStore.getState().apply()}
      >
        {candidate === color
          ? `${colorById(color).name} SELECTED ✓`
          : `APPLY ${colorById(candidate).name}`}
      </button>
      {available.length < hairColors.length && (
        <p className={s.finePrint}>
          × の色は、このスタイルでは選択できません。
        </p>
      )}
    </div>
  );
}
