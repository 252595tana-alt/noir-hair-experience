"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { FrontSide, Vector2, type ShaderMaterial, type Texture } from "three";
import { useSiteStore } from "@/store/useSiteStore";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { useTransitionTextures } from "../TextureManager";
import {
  hairRibbonFragment,
  hairRibbonVertex,
  utils,
} from "../shaders.generated";
import { createRibbonGeometry } from "./ribbonGeometry";

export type HairLoomPointer = { x: number; y: number };

type RibbonStyle = {
  image: string;
  focusY: number;
};

const textureSize = (texture: Texture) => {
  const image = texture.image as { width?: number; height?: number };
  return new Vector2(image?.width || 1024, image?.height || 1536);
};

export function HairRibbonScene({
  current,
  next,
  direction,
  transitionId,
  activeTransition,
  viewportActive,
  ribbonCount,
  segmentCount,
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
  ribbonCount: number;
  segmentCount: number;
  pointer: MutableRefObject<HairLoomPointer>;
  onReady: () => void;
  onComplete: (transitionId: number) => void;
  onFailure: () => void;
}) {
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const tier = usePerformanceTier((state) => state.tier);
  const geometry = useMemo(
    () => createRibbonGeometry(ribbonCount, segmentCount),
    [ribbonCount, segmentCount],
  );
  const outgoingMaterial = useRef<ShaderMaterial>(null);
  const incomingMaterial = useRef<ShaderMaterial>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const viewportActiveRef = useRef(viewportActive);
  const playedTransition = useRef(0);
  const mouse = useRef(new Vector2());
  const mouseTarget = useRef(new Vector2());
  const renderState = useRef({
    fromTexture: null as Texture | null,
    toTexture: null as Texture | null,
    fromSize: new Vector2(1024, 1536),
    toSize: new Vector2(1024, 1536),
    fromFocus: current.focusY,
    toFocus: next.focusY,
    direction: 1,
    progress: 0,
  });
  const textures = useTransitionTextures(current.image, next.image, onFailure);

  const uniforms = useMemo(() => {
    const common = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uDirection: { value: 1 },
      uMouse: { value: new Vector2() },
      uResolution: { value: new Vector2(1, 1) },
      uQuality: { value: 1 },
    };
    return {
      outgoing: {
        ...common,
        uRole: { value: -1 },
        uTexture: { value: null as Texture | null },
        uTextureSize: { value: new Vector2(1024, 1536) },
        uFocus: { value: current.focusY },
      },
      incoming: {
        ...common,
        uRole: { value: 1 },
        uTexture: { value: null as Texture | null },
        uTextureSize: { value: new Vector2(1024, 1536) },
        uFocus: { value: next.focusY },
      },
    };
    // Uniform containers stay stable for the lifetime of this Canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    invalidate();
  }, [size.width, size.height, invalidate]);

  useEffect(() => {
    if (!textures.textures || !textures.requestedReady) return;
    const [fromTexture, toTexture] = textures.textures;
    renderState.current.fromTexture = fromTexture;
    renderState.current.toTexture = toTexture;
    renderState.current.fromSize.copy(textureSize(fromTexture));
    renderState.current.toSize.copy(textureSize(toTexture));
    renderState.current.fromFocus = current.focusY;
    renderState.current.toFocus = next.focusY;
    renderState.current.direction = direction;
    onReady();

    if (!activeTransition || transitionId <= playedTransition.current) {
      if (!activeTransition) renderState.current.progress = 0;
      invalidate();
      return;
    }

    playedTransition.current = transitionId;
    tween.current?.kill();
    const driver = { progress: 0 };
    renderState.current.progress = 0;
    tween.current = gsap.to(driver, {
      progress: 1,
      duration:
        usePerformanceTier.getState().tier === "high" ? 1.42 : 1.24,
      ease: "power2.inOut",
      paused:
        document.hidden ||
        useSiteStore.getState().salonOpen ||
        !viewportActiveRef.current,
      onUpdate: () => {
        renderState.current.progress = driver.progress;
      },
      onComplete: () => {
        renderState.current.progress = 1;
        tween.current = null;
        invalidate();
        onComplete(transitionId);
      },
    });

    return () => {
      tween.current?.kill();
      tween.current = null;
    };
  }, [
    textures.textures,
    textures.requestedReady,
    current.focusY,
    next.focusY,
    direction,
    transitionId,
    activeTransition,
    invalidate,
    onReady,
    onComplete,
  ]);

  useEffect(() => {
    const update = () =>
      tween.current?.paused(
        document.hidden ||
          useSiteStore.getState().salonOpen ||
          !viewportActiveRef.current,
      );
    const unsubscribe = useSiteStore.subscribe((state, previous) => {
      if (state.salonOpen !== previous.salonOpen) update();
    });
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    viewportActiveRef.current = viewportActive;
    tween.current?.paused(
      document.hidden ||
        useSiteStore.getState().salonOpen ||
        !viewportActive,
    );
  }, [viewportActive]);

  useFrame((_, delta) => {
    const outgoing = outgoingMaterial.current?.uniforms;
    const incoming = incomingMaterial.current?.uniforms;
    if (!outgoing || !incoming) return;
    const frame = renderState.current;
    const safeDelta = Math.min(delta, 0.05);
    outgoing.uTime.value += safeDelta;
    incoming.uTime.value = outgoing.uTime.value;
    mouseTarget.current.set(pointer.current.x, pointer.current.y);
    mouse.current.lerp(mouseTarget.current, Math.min(1, safeDelta * 7));
    outgoing.uMouse.value.copy(mouse.current);
    incoming.uMouse.value.copy(mouse.current);
    outgoing.uProgress.value = frame.progress;
    incoming.uProgress.value = frame.progress;
    outgoing.uDirection.value = frame.direction;
    incoming.uDirection.value = frame.direction;
    outgoing.uResolution.value.set(size.width, size.height);
    incoming.uResolution.value.set(size.width, size.height);
    outgoing.uQuality.value = tier === "high" ? 1 : 0.58;
    incoming.uQuality.value = tier === "high" ? 1 : 0.58;
    outgoing.uTexture.value = frame.fromTexture;
    incoming.uTexture.value = frame.toTexture;
    outgoing.uTextureSize.value.copy(frame.fromSize);
    incoming.uTextureSize.value.copy(frame.toSize);
    outgoing.uFocus.value = frame.fromFocus;
    incoming.uFocus.value = frame.toFocus;
  });

  return (
    <group>
      <mesh
        geometry={geometry}
        frustumCulled={false}
        renderOrder={1}
      >
        <shaderMaterial
          ref={outgoingMaterial}
          uniforms={uniforms.outgoing}
          vertexShader={hairRibbonVertex}
          fragmentShader={utils + hairRibbonFragment}
          transparent
          side={FrontSide}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        geometry={geometry}
        frustumCulled={false}
        renderOrder={2}
      >
        <shaderMaterial
          ref={incomingMaterial}
          uniforms={uniforms.incoming}
          vertexShader={hairRibbonVertex}
          fragmentShader={utils + hairRibbonFragment}
          transparent
          side={FrontSide}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
