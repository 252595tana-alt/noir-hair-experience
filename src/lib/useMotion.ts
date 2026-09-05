"use client";
import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
export function useMotion(
  ref: RefObject<HTMLElement | null>,
  key: string,
  kind: "mode" | "image" | "style" | "quiet" = "mode",
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const match = gsap.matchMedia();
    match.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          scale: kind === "mode" || kind === "quiet" ? 1 : 1.025,
          x: kind === "style" ? 24 : 0,
          filter: kind === "image" ? "blur(5px)" : "blur(0px)",
        },
        {
          opacity: 1,
          scale: 1,
          x: 0,
          filter: "blur(0px)",
          duration: kind === "mode" ? 0.65 : kind === "quiet" ? 0.3 : 0.5,
          ease: "power2.out",
          clearProps: "transform,filter,opacity",
        },
      );
    });
    return () => match.revert();
  }, [ref, key, kind]);
}
