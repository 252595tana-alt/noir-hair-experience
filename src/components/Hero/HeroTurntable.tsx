"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ANGLE_COUNT, DRAG_STEP, wrapAngle } from "@/lib/constants";
import { useSiteStore } from "@/store/useSiteStore";
import s from "../experience.module.css";

const angleNames = [
  "正面",
  "右斜め前",
  "右側面",
  "右斜め後ろ",
  "後ろ",
  "左斜め後ろ",
  "左側面",
  "左斜め前",
] as const;

const wrapFrame = (value: number) =>
  ((value % ANGLE_COUNT) + ANGLE_COUNT) % ANGLE_COUNT;

const nearestTurn = (angle: number, current: number) => {
  const normalized = wrapFrame(angle);
  return normalized + Math.round((current - normalized) / ANGLE_COUNT) * ANGLE_COUNT;
};

const frameStyle = (index: number, opacity: number) =>
  ({
    "--frame-x": `${(index % 4) * (100 / 3)}%`,
    "--frame-y": `${Math.floor(index / 4) * 100}%`,
    opacity,
  }) as CSSProperties;

type Gesture = {
  id: number;
  x: number;
  y: number;
  start: number;
  previousX: number;
  previousTime: number;
  velocity: number;
  locked: boolean;
};

export function HeroTurntable({ interactive }: { interactive: boolean }) {
  const selectedAngle = useSiteStore((state) => state.selectedAngle);
  const reducedMotion = useReducedMotion();
  const [visualAngle, setVisualAngle] = useState(selectedAngle);
  const [rotating, setRotating] = useState(false);
  const visual = useRef(selectedAngle);
  const gesture = useRef<Gesture | null>(null);
  const animation = useRef<number | null>(null);

  const updateVisual = useCallback((value: number) => {
    visual.current = value;
    setVisualAngle(value);
  }, []);

  const stopAnimation = useCallback(() => {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
  }, []);

  const animateTo = useCallback(
    (target: number) => {
      stopAnimation();
      const start = visual.current;
      if (reducedMotion || Math.abs(target - start) < 0.001) {
        updateVisual(target);
        setRotating(false);
        return;
      }
      const started = performance.now();
      const duration = 280;
      setRotating(true);
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        updateVisual(start + (target - start) * eased);
        if (progress < 1) {
          animation.current = requestAnimationFrame(tick);
        } else {
          animation.current = null;
          setRotating(false);
        }
      };
      animation.current = requestAnimationFrame(tick);
    },
    [reducedMotion, stopAnimation, updateVisual],
  );

  useEffect(() => {
    if (!interactive) {
      stopAnimation();
      updateVisual(nearestTurn(0, visual.current));
      setRotating(false);
      return;
    }
    if (!gesture.current)
      animateTo(nearestTurn(selectedAngle, visual.current));
  }, [interactive, selectedAngle, animateTo, stopAnimation, updateVisual]);

  useEffect(
    () => () => {
      stopAnimation();
    },
    [stopAnimation],
  );

  const selectVisualAngle = (value: number) => {
    const next = wrapAngle(value);
    if (useSiteStore.getState().selectedAngle !== next)
      useSiteStore.getState().setAngle(next);
  };

  const rotateBy = (direction: number) => {
    if (!interactive) return;
    const state = useSiteStore.getState();
    const next = wrapAngle(state.selectedAngle + direction);
    state.markRotated();
    state.setAngle(next);
    animateTo(nearestTurn(next, visual.current));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!interactive) return;
    stopAnimation();
    setRotating(false);
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: visual.current,
      previousX: event.clientX,
      previousTime: event.timeStamp,
      velocity: 0,
      locked: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.locked) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        gesture.current = null;
        setRotating(false);
        return;
      }
      if (Math.abs(dx) < 8) return;
      current.locked = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setRotating(true);
      useSiteStore.getState().markRotated();
    }
    const next = current.start - dx / DRAG_STEP;
    const elapsed = Math.max(8, event.timeStamp - current.previousTime);
    current.velocity = (current.previousX - event.clientX) / DRAG_STEP / elapsed;
    current.previousX = event.clientX;
    current.previousTime = event.timeStamp;
    updateVisual(next);
    selectVisualAngle(next);
  };

  const settle = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    gesture.current = null;
    if (current.locked && event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!current.locked) {
      setRotating(false);
      return;
    }
    const momentum = cancelled || reducedMotion
      ? 0
      : Math.max(-1.35, Math.min(1.35, current.velocity * 150));
    const target = Math.round(visual.current + momentum);
    selectVisualAngle(target);
    animateTo(target);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      rotateBy(event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : ANGLE_COUNT - 1;
      const state = useSiteStore.getState();
      state.markRotated();
      state.setAngle(next);
      animateTo(nearestTurn(next, visual.current));
    }
  };

  const floor = Math.floor(visualAngle);
  const blend = visualAngle - floor;
  const first = wrapFrame(floor);
  const second = wrapFrame(floor + 1);
  const angleText = `${selectedAngle * 45}度・${angleNames[selectedAngle]}`;

  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/images/hero-360/turntable-v2.avif"
        type="image/avif"
      />
      <div
        className={s.heroTurntable}
        data-hero-portrait
        data-angle={selectedAngle}
        data-visual-angle={wrapAngle(visualAngle)}
        data-rotating={rotating}
        data-interactive={interactive}
        data-cursor={interactive ? "ROTATE" : undefined}
        data-testid="hero-turntable"
        role="slider"
        aria-label="人物の360度ビュー。左右にドラッグ、または矢印キーで回転できます"
        aria-valuemin={1}
        aria-valuemax={8}
        aria-valuenow={selectedAngle + 1}
        aria-valuetext={angleText}
        aria-orientation="horizontal"
        aria-disabled={!interactive}
        tabIndex={interactive ? 0 : -1}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => settle(event)}
        onPointerCancel={(event) => settle(event, true)}
        onPointerLeave={() => {
          if (gesture.current && !gesture.current.locked) {
            gesture.current = null;
            setRotating(false);
          }
        }}
        onLostPointerCapture={(event) => {
          if (event.target === event.currentTarget && gesture.current)
            settle(event, true);
        }}
      >
        <span
          className={s.heroTurntableFrame}
          style={frameStyle(first, 1 - blend)}
          aria-hidden="true"
        />
        <span
          className={s.heroTurntableFrame}
          style={frameStyle(second, blend)}
          aria-hidden="true"
        />
        <span className={s.heroTurntableLight} aria-hidden="true" />
      </div>
    </>
  );
}
