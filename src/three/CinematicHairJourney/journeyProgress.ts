import { MathUtils } from "three";

export type HairJourneyUniforms = {
  uScrollProgress: { value: number };
  uCutProgress: { value: number };
  uColorProgress: { value: number };
  uTreatmentProgress: { value: number };
  uStyleProgress: { value: number };
  uWaveStrength: { value: number };
  uFinalProgress: { value: number };
};

/** Maps the shared 0..1 story clock to the six visual chapters. */
export function updateJourneyProgress(
  uniforms: HairJourneyUniforms,
  sourceProgress: number,
) {
  const progress = MathUtils.clamp(sourceProgress, 0, 1);
  const styling = MathUtils.smoothstep(progress, 0.66, 0.84);
  uniforms.uScrollProgress.value = progress;
  uniforms.uCutProgress.value = MathUtils.smoothstep(progress, 0.12, 0.3);
  uniforms.uColorProgress.value = MathUtils.smoothstep(progress, 0.3, 0.48);
  uniforms.uTreatmentProgress.value = MathUtils.smoothstep(
    progress,
    0.48,
    0.66,
  );
  uniforms.uStyleProgress.value = styling;
  uniforms.uWaveStrength.value = MathUtils.lerp(0.06, 0.5, styling);
  uniforms.uFinalProgress.value = MathUtils.smoothstep(progress, 0.84, 1);
}
