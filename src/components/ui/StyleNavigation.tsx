"use client";

import { Arrow } from "./Arrow";
import s from "./HairUnwovenUI.module.css";

export function StyleNavigation({
  onPrevious,
  onNext,
  isTransitioning,
}: {
  onPrevious: () => void;
  onNext: () => void;
  isTransitioning: boolean;
}) {
  return (
    <nav
      className={s.navigation}
      aria-label="Hair style gallery navigation"
      data-transitioning={isTransitioning}
    >
      <button type="button" onClick={onPrevious} aria-label="PREVIOUS STYLE">
        <Arrow direction="left" />
      </button>
      <button type="button" onClick={onNext} aria-label="NEXT STYLE">
        <Arrow />
      </button>
    </nav>
  );
}
