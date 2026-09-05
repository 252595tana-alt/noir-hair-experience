"use client";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { sampleFps } from "./fps";
export function PerformanceManager({ fps = 60 }: { fps?: number }) {
  const sample = useRef({ elapsed: 0, frames: 0, slow: 0 });
  useFrame((_, delta) => {
    if (sampleFps(sample.current, delta, fps <= 30 ? 18 : 30)) {
      usePerformanceTier.getState().downgrade();
    }
  });
  return null;
}
