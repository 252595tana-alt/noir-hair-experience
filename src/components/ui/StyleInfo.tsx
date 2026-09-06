"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { HairUnwovenStyle } from "@/data/hairUnwovenStyles";
import s from "./HairUnwovenUI.module.css";

export function StyleInfo({
  style,
  index,
  total,
  isTransitioning,
}: {
  style: HairUnwovenStyle;
  index: number;
  total: number;
  isTransitioning: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const tween = isTransitioning
        ? gsap.to(node, {
            opacity: 0.2,
            y: -8,
            duration: 0.34,
            ease: "power2.inOut",
          })
        : gsap.fromTo(
            node,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              clearProps: "transform,opacity",
            },
          );
      return () => tween.kill();
    });
    return () => media.revert();
  }, [style.id, isTransitioning]);

  return (
    <div
      ref={root}
      className={s.info}
      aria-live="polite"
      aria-atomic="true"
      data-transitioning={isTransitioning}
    >
      <span className={s.count}>
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      <div className={s.copy}>
        <h3 className={s.title}>{style.title}</h3>
        <p className={s.description}>{style.description}</p>
      </div>
    </div>
  );
}
