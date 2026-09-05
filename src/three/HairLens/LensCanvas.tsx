"use client";
import type { ComponentProps } from "react";
import WebGLExperience from "../WebGLExperience";
import { HairLens } from "./HairLens";
export default function LensCanvas(props: ComponentProps<typeof HairLens>) {
  return (
    <WebGLExperience onFailure={props.onFailure}>
      <HairLens {...props} />
    </WebGLExperience>
  );
}
