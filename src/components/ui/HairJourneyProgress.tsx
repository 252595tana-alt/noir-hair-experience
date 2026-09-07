import type { HairJourneyChapter } from "@/data/hairJourney";
import s from "../sections/CinematicHairJourney.module.css";

export function HairJourneyProgress({
  chapters,
  activeIndex,
}: {
  chapters: readonly HairJourneyChapter[];
  activeIndex: number;
}) {
  const numberedChapters = chapters.filter((chapter) => chapter.id !== "intro");

  return (
    <nav className={s.progress} aria-label="Hair transformation progress">
      <ol>
        {numberedChapters.map((chapter, index) => {
          const sourceIndex = index + 1;
          const active = sourceIndex === activeIndex;
          return (
            <li key={chapter.id} data-active={active} aria-current={active ? "step" : undefined}>
              <span>{chapter.number}</span>
              <span>{chapter.navigationLabel}</span>
            </li>
          );
        })}
      </ol>
      <div className={s.progressTrack} aria-hidden="true">
        <span />
      </div>
    </nav>
  );
}
