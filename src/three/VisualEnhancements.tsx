"use client";
import { useEffect, useRef } from "react";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { useReducedMotion } from "@/hooks/useReducedMotion";
export function VisualEnhancements() {
  const cursor = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    usePerformanceTier.getState().initialize();
  }, []);
  useEffect(() => {
    const node = cursor.current;
    if (!node || reduced || !matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      if (document.hidden) return;
      const target =
        e.target instanceof Element
          ? e.target.closest("button, a, [data-cursor]")
          : null;
      const text = target?.textContent ?? "";
      const label =
        target?.getAttribute("data-cursor") ||
        (text.includes("BOOK")
          ? "BOOK"
          : target?.getAttribute("aria-label") &&
              target.closest('[aria-label="ヘアカラー"]')
            ? "TRY"
            : target
              ? "VIEW"
              : "");
      node.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      node.style.opacity = "1";
      node.dataset.active = label ? "true" : "false";
      node.textContent = label;
    };
    const leave = () => {
      node.style.opacity = "0";
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [reduced]);
  return reduced ? null : (
    <div ref={cursor} className="hair-cursor" aria-hidden="true" />
  );
}
