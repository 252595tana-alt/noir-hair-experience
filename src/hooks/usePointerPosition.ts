"use client";
import { useEffect, useRef, type RefObject } from "react";
export function usePointerPosition(ref: RefObject<HTMLElement | null>) {
  const pointer = useRef({ x: 0.5, y: 0.55 });
  useEffect(() => {
    const node = ref.current;
    if (!node || !matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      pointer.current.x = (event.clientX - rect.left) / rect.width;
      pointer.current.y = 1 - (event.clientY - rect.top) / rect.height;
    };
    node.addEventListener("pointermove", move);
    return () => node.removeEventListener("pointermove", move);
  }, [ref]);
  return pointer;
}
