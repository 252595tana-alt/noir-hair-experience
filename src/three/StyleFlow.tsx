"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
const TransitionCanvas = dynamic(
  () => import("./HairTransition/TransitionCanvas"),
  { ssr: false },
);
export function StyleFlow({
  from,
  to,
  direction,
}: {
  from: string;
  to: string;
  direction: number;
}) {
  const supported = useWebGLSupport(),
    reduced = useReducedMotion();
  const tier = usePerformanceTier((s) => s.tier);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 1400);
    return () => clearTimeout(timer);
  }, []);
  if (!from || from === to || !supported || reduced || tier === "low" || done)
    return null;
  return <TransitionCanvas from={from} to={to} direction={direction} />;
}
