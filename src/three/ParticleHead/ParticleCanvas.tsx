"use client";
import WebGLExperience from "../WebGLExperience";
import { ParticleHead } from "./ParticleHead";
export default function ParticleCanvas({
  opening = false,
  startedAt = 0,
  onFailure,
}: {
  opening?: boolean;
  startedAt?: number;
  onFailure?: () => void;
}) {
  return (
    <WebGLExperience continuous fps={opening ? 60 : 30} onFailure={onFailure}>
      <ParticleHead opening={opening} startedAt={startedAt} />
    </WebGLExperience>
  );
}
