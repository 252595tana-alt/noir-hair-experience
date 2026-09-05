"use client";
import type { ComponentProps } from "react";
import WebGLExperience from "../WebGLExperience";
import { HairTransition } from "./HairTransition";
export default function TransitionCanvas(
  props: ComponentProps<typeof HairTransition>,
) {
  return (
    <WebGLExperience>
      <HairTransition {...props} />
    </WebGLExperience>
  );
}
