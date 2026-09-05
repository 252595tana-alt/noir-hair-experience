"use client";
import type { MutableRefObject } from "react";
import WebGLExperience from "./WebGLExperience";
import { ParticleHead } from "./ParticleHead/ParticleHead";
import { HairLens } from "./HairLens/HairLens";
import { HairTransition } from "./HairTransition/HairTransition";
export function ParticleCanvas({
  opening = false,
  startedAt = 0,
  onFailure,
}: {
  opening?: boolean;
  startedAt?: number;
  onFailure?: () => void;
}) {
  return (
    <WebGLExperience onFailure={onFailure}>
      <ParticleHead opening={opening} startedAt={startedAt} />
    </WebGLExperience>
  );
}
export function LensCanvas(props: {
  current: string;
  candidate: string;
  applying: boolean;
  pointer: MutableRefObject<{ x: number; y: number }>;
  onFailure: () => void;
}) {
  return (
    <WebGLExperience onFailure={props.onFailure}>
      <HairLens {...props} />
    </WebGLExperience>
  );
}
export function TransitionCanvas(props: {
  from: string;
  to: string;
  direction: number;
}) {
  return (
    <WebGLExperience>
      <HairTransition {...props} />
    </WebGLExperience>
  );
}
