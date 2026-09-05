"use client";
import { useSyncExternalStore } from "react";
let supported: boolean | undefined;
function check() {
  if (supported !== undefined) return supported;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", {
      failIfMajorPerformanceCaveat: false,
    });
    supported = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    supported = false;
  }
  return supported;
}
const subscribe = () => () => {};
export function useWebGLSupport() {
  return useSyncExternalStore(subscribe, check, () => false);
}
