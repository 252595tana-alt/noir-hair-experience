"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  DoubleSide,
  Vector2,
  type ShaderMaterial,
} from "three";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { hairJourneyColorStops } from "@/data/hairJourney";
import {
  cinematicHairFragment,
  cinematicHairVertex,
} from "../shaders.generated";
import type { HairJourneyPointer } from "./CinematicHairCanvas";
import { createHairJourneyGeometry } from "./hairJourneyGeometry";
import {
  updateJourneyProgress,
  type HairJourneyUniforms,
} from "./journeyProgress";

export function HairRibbon({
  progressRef,
  pointerRef,
  lengthSegments,
  widthSegments,
  mobile,
}: {
  progressRef: MutableRefObject<number>;
  pointerRef: MutableRefObject<HairJourneyPointer>;
  lengthSegments: number;
  widthSegments: number;
  mobile: boolean;
}) {
  const tier = usePerformanceTier((state) => state.tier);
  const material = useRef<ShaderMaterial>(null);
  const mouse = useRef(new Vector2());
  const mouseTarget = useRef(new Vector2());
  const geometry = useMemo(
    () => createHairJourneyGeometry(lengthSegments, widthSegments),
    [lengthSegments, widthSegments],
  );
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uCutProgress: { value: 0 },
      uColorProgress: { value: 0 },
      uTreatmentProgress: { value: 0 },
      uStyleProgress: { value: 0 },
      uWaveStrength: { value: 0.06 },
      uFinalProgress: { value: 0 },
      uMouse: { value: new Vector2() },
      uQuality: { value: 1 },
      uKeyColor: { value: new Color("#eee7dc") },
      uRimColor: { value: new Color("#c9d0d8") },
      uColor0: { value: new Color(hairJourneyColorStops[0].color) },
      uColor1: { value: new Color(hairJourneyColorStops[1].color) },
      uColor2: { value: new Color(hairJourneyColorStops[2].color) },
      uColor3: { value: new Color(hairJourneyColorStops[3].color) },
      uHighlight0: {
        value: new Color(hairJourneyColorStops[0].highlight),
      },
      uHighlight1: {
        value: new Color(hairJourneyColorStops[1].highlight),
      },
      uHighlight2: {
        value: new Color(hairJourneyColorStops[2].highlight),
      },
      uHighlight3: {
        value: new Color(hairJourneyColorStops[3].highlight),
      },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const values = material.current?.uniforms;
    if (!values) return;
    const safeDelta = Math.min(delta, 0.05);
    values.uTime.value += safeDelta;
    updateJourneyProgress(
      values as unknown as HairJourneyUniforms,
      progressRef.current,
    );
    mouseTarget.current.set(pointerRef.current.x, pointerRef.current.y);
    mouse.current.lerp(mouseTarget.current, Math.min(1, safeDelta * 4.5));
    values.uMouse.value.copy(mouse.current);
    values.uQuality.value = mobile ? 0.55 : tier === "high" ? 1 : 0.75;
  });

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={cinematicHairVertex}
        fragmentShader={cinematicHairFragment}
        side={DoubleSide}
        transparent
        depthTest
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
