"use client";

import type { MutableRefObject } from "react";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import WebGLExperience from "../WebGLExperience";
import { HairJourneyScene } from "./HairJourneyScene";

export type HairJourneyPointer = { x: number; y: number };

export type CinematicHairCanvasProps = {
  progressRef: MutableRefObject<number>;
  pointerRef: MutableRefObject<HairJourneyPointer>;
  active: boolean;
  finalImage: string;
  onReady: () => void;
  onFailure: () => void;
};

export default function CinematicHairCanvas({
  progressRef,
  pointerRef,
  active,
  finalImage,
  onReady,
  onFailure,
}: CinematicHairCanvasProps) {
  const tier = usePerformanceTier((state) => state.tier);
  const mobile = usePerformanceTier((state) => state.mobile);
  const lengthSegments = mobile ? 44 : tier === "high" ? 112 : 76;
  const widthSegments = mobile ? 3 : tier === "high" ? 7 : 5;
  const particleCount = mobile ? 14 : tier === "high" ? 48 : 28;
  const threadCount = mobile ? 24 : tier === "high" ? 52 : 36;
  const threadSegments = mobile ? 12 : tier === "high" ? 22 : 16;

  return (
    <div
      style={{ position: "absolute", inset: 0 }}
      data-testid="cinematic-hair-canvas"
      data-segments={`${lengthSegments}x${widthSegments}`}
      data-particles={particleCount}
      data-threads={threadCount}
    >
      <WebGLExperience
        continuous={active}
        fps={mobile ? 45 : 60}
        onFailure={onFailure}
      >
        <HairJourneyScene
          progressRef={progressRef}
          pointerRef={pointerRef}
          active={active}
          finalImage={finalImage}
          lengthSegments={lengthSegments}
          widthSegments={widthSegments}
          particleCount={particleCount}
          threadCount={threadCount}
          threadSegments={threadSegments}
          mobile={mobile}
          onReady={onReady}
          onFailure={onFailure}
        />
      </WebGLExperience>
    </div>
  );
}
