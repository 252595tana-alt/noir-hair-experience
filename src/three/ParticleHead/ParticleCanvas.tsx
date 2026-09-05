"use client";
import type { RefObject } from "react";
import WebGLExperience from "../WebGLExperience";
import { ParticleHead, type PortraitSamples, type FormationClock } from "./ParticleHead";
export default function ParticleCanvas({ portrait, clock, onReady, onFailure }: {
  portrait: PortraitSamples;
  clock: RefObject<FormationClock>;
  onReady: () => void;
  onFailure: () => void;
}) {
  return <WebGLExperience continuous fps={60} onFailure={onFailure}>
    <ParticleHead portrait={portrait} clock={clock} onReady={onReady} />
  </WebGLExperience>;
}
