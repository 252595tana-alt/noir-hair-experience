"use client";

import type { MutableRefObject } from "react";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import WebGLExperience from "../WebGLExperience";
import {
  HairRibbonScene,
  type HairLoomPointer,
} from "./HairRibbonScene";

type RibbonStyle = { image: string; focusY: number };

export default function HairLoomCanvas({
  current,
  next,
  direction,
  transitionId,
  activeTransition,
  viewportActive,
  pointer,
  onReady,
  onComplete,
  onFailure,
}: {
  current: RibbonStyle;
  next: RibbonStyle;
  direction: number;
  transitionId: number;
  activeTransition: boolean;
  viewportActive: boolean;
  pointer: MutableRefObject<HairLoomPointer>;
  onReady: () => void;
  onComplete: (transitionId: number) => void;
  onFailure: () => void;
}) {
  const tier = usePerformanceTier((state) => state.tier);
  const mobile = usePerformanceTier((state) => state.mobile);
  const ribbonCount = mobile ? 28 : tier === "high" ? 60 : 40;
  const segmentCount = mobile ? 14 : tier === "high" ? 24 : 18;

  return (
    <div
      style={{ position: "absolute", inset: 0 }}
      data-testid="hair-loom-canvas"
      data-ribbons={ribbonCount}
      data-segments={segmentCount}
    >
      <WebGLExperience
        onFailure={onFailure}
        continuous={activeTransition}
        fps={mobile ? 45 : 60}
      >
        <HairRibbonScene
          current={current}
          next={next}
          direction={direction}
          transitionId={transitionId}
          activeTransition={activeTransition}
          viewportActive={viewportActive}
          ribbonCount={ribbonCount}
          segmentCount={segmentCount}
          pointer={pointer}
          onReady={onReady}
          onComplete={onComplete}
          onFailure={onFailure}
        />
      </WebGLExperience>
    </div>
  );
}
