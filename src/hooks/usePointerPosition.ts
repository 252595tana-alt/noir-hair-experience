"use client";
import { useCallback, useEffect, useRef, type RefObject } from "react";
export function usePointerPosition(ref: RefObject<HTMLElement | null>) {
  const pointer = useRef({ x: 0.5, y: 0.55 });
  const setPointer = useCallback((x: number, y: number) => {
    pointer.current.x = x;
    pointer.current.y = y;
  }, []);
  useEffect(() => {
    const node = ref.current;
    if (!node || !matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      setPointer(
        (event.clientX - rect.left) / rect.width,
        1 - (event.clientY - rect.top) / rect.height,
      );
    };
    node.addEventListener("pointermove", move);
    return () => node.removeEventListener("pointermove", move);
  }, [ref, setPointer]);
  return { pointer, setPointer };
}
