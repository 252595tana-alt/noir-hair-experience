"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3, type Texture } from "three";
import { useManagedTextures } from "../TextureManager";
import type { HairJourneyPointer } from "./CinematicHairCanvas";
import { FinalHairThreads } from "./FinalHairThreads";
import { HairParticles } from "./HairParticles";
import { HairRibbon } from "./HairRibbon";

const clampProgress = (value: number) => MathUtils.clamp(value, 0, 1);

export function HairJourneyScene({
  progressRef,
  pointerRef,
  active,
  finalImage,
  lengthSegments,
  widthSegments,
  particleCount,
  threadCount,
  threadSegments,
  mobile,
  onReady,
  onFailure,
}: {
  progressRef: MutableRefObject<number>;
  pointerRef: MutableRefObject<HairJourneyPointer>;
  active: boolean;
  finalImage: string;
  lengthSegments: number;
  widthSegments: number;
  particleCount: number;
  threadCount: number;
  threadSegments: number;
  mobile: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const textures = useManagedTextures(finalImage, finalImage, onFailure);
  const ready = useRef(false);
  const cameraDestination = useRef(new Vector3(0, 0, 4.65));
  const lookAt = useRef(new Vector3(0, 0.02, 0));

  useEffect(() => {
    ready.current = false;
  }, [finalImage]);

  useEffect(() => {
    if (!textures || ready.current) return;
    ready.current = true;
    onReady();
    invalidate();
  }, [textures, onReady, invalidate]);

  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);

  useFrame((_, delta) => {
    const progress = clampProgress(progressRef.current);
    const cut = MathUtils.smoothstep(progress, 0.12, 0.3);
    const color = MathUtils.smoothstep(progress, 0.3, 0.48);
    const treatment = MathUtils.smoothstep(progress, 0.48, 0.66);
    const styling = MathUtils.smoothstep(progress, 0.66, 0.84);
    const final = MathUtils.smoothstep(progress, 0.84, 1);

    // A restrained editorial dolly: CUT moves closer, COLOR travels sideways,
    // TREATMENT finds the rim highlight, then the camera settles for the photo.
    const destination = cameraDestination.current;
    destination.set(0, 0.02, 4.65);
    destination.z = MathUtils.lerp(destination.z, 3.58, cut);
    destination.x = MathUtils.lerp(destination.x, 0.3, color);
    destination.z = MathUtils.lerp(destination.z, 3.78, color);
    destination.x = MathUtils.lerp(destination.x, -0.24, treatment);
    destination.y = MathUtils.lerp(destination.y, 0.09, treatment);
    destination.z = MathUtils.lerp(destination.z, 3.62, treatment);
    destination.x = MathUtils.lerp(destination.x, 0, styling);
    destination.y = MathUtils.lerp(destination.y, 0, styling);
    destination.z = MathUtils.lerp(destination.z, 4.3, styling);
    destination.z = MathUtils.lerp(destination.z, 4.7, final);
    camera.position.lerp(destination, 1 - Math.exp(-Math.min(delta, 0.05) * 4.8));
    camera.lookAt(lookAt.current);
  }, -1);

  const finalTexture = textures?.[0] as Texture | undefined;

  return (
    <group>
      <HairRibbon
        progressRef={progressRef}
        pointerRef={pointerRef}
        lengthSegments={lengthSegments}
        widthSegments={widthSegments}
        mobile={mobile}
      />
      <HairParticles
        progressRef={progressRef}
        count={particleCount}
        mobile={mobile}
      />
      {finalTexture && (
        <FinalHairThreads
          progressRef={progressRef}
          pointerRef={pointerRef}
          texture={finalTexture}
          ribbonCount={threadCount}
          segmentCount={threadSegments}
          mobile={mobile}
        />
      )}
    </group>
  );
}
