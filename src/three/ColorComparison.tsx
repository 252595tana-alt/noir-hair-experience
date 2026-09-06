"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, type RefObject } from "react";
import { HairImage as SafeImage } from "@/components/ui/HairImage";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useReducedData } from "@/hooks/useReducedData";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { usePointerPosition } from "@/hooks/usePointerPosition";
import { useSiteStore } from "@/store/useSiteStore";
import { styleById } from "@/data/styles";
import { colorById, hairStyles } from "@/data/hairStyles";
import {
  hairImageSizes,
  hairTextureWidth,
  resolveHairAsset,
} from "@/lib/hairAssets";
import { usePreviewStore, useTryColor } from "./previewStore";
import { LightSweep } from "./LightSweep/LightSweep";
const LensCanvas = dynamic(() => import("./HairLens/LensCanvas"), {
  ssr: false,
});
export function ColorComparison({
  target,
}: {
  target: RefObject<HTMLDivElement | null>;
}) {
  const { pointer, setPointer } = usePointerPosition(target);
  const capable = useWebGLSupport(),
    reduced = useReducedMotion(),
    saveData = useReducedData();
  const tier = usePerformanceTier((s) => s.tier);
  const color = useSiteStore((s) => s.selectedColor),
    angle = useSiteStore((s) => s.selectedAngle),
    styleId = useSiteStore((s) => s.selectedStyleId);
  const candidate = useTryColor();
  const preview = usePreviewStore();
  const [expired, setExpired] = useState(preview.applyId);
  const [failed, setFailed] = useState(false);
  const [split, setSplit] = useState(50);
  const [fine, setFine] = useState(false);
  const applying = preview.applyId > expired;
  const frames = styleById(styleId)?.hairImages ?? hairStyles;
  const currentSrc = frames[applying ? preview.from : color][angle];
  const trySrc = frames[applying ? color : candidate][angle];
  const textureWidth = hairTextureWidth(tier);
  const currentTexture = resolveHairAsset(currentSrc, textureWidth);
  const tryTexture = resolveHairAsset(trySrc, textureWidth);
  const tryAccent = colorById(applying ? color : candidate).accent;
  const lens =
    capable && !reduced && !saveData && fine && tier !== "low" && !failed;
  const fail = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const media = matchMedia("(pointer: fine) and (min-width: 768px)");
    const update = () => setFine(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const timeout = setTimeout(
      () => setExpired(preview.applyId),
      reduced ? 0 : 850,
    );
    return () => clearTimeout(timeout);
  }, [preview.applyId, reduced]);
  if (candidate === color && !applying) return <LightSweep />;
  return (
    <>
      <div
        className="color-comparison"
        data-testid="color-comparison"
        data-comparison={lens ? "lens" : "slider"}
        aria-hidden="true"
      >
        {applying && (
          <SafeImage
            src={currentSrc}
            alt=""
            fill
            unoptimized
            draggable={false}
            sizes={hairImageSizes}
          />
        )}
        <div
          className="comparison-after"
          style={{ clipPath: `inset(0 ${applying ? 0 : 100 - split}% 0 0)` }}
        >
          <SafeImage
            src={trySrc}
            alt=""
            fill
            unoptimized
            draggable={false}
            sizes={hairImageSizes}
          />
        </div>
        {!applying && !lens && (
          <span className="comparison-rule" style={{ left: `${split}%` }} />
        )}
        {lens && (
          <LensCanvas
            current={currentTexture}
            candidate={tryTexture}
            accent={tryAccent}
            pointer={pointer}
            applying={applying}
            onFailure={fail}
          />
        )}
      </div>
      {!applying && (
        <label
          className="comparison-control"
          data-visual={lens ? "veil" : "split"}
          style={{ "--try-accent": tryAccent } as React.CSSProperties}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <span>
            TRY <span>← COMPARE →</span> CURRENT
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={split}
            onChange={(e) => {
              const next = Number(e.target.value);
              setSplit(next);
              setPointer(next / 100, 0.55);
            }}
            aria-label="BEFORE / AFTER カラー比較"
          />
        </label>
      )}
      {!lens && <LightSweep />}
    </>
  );
}
