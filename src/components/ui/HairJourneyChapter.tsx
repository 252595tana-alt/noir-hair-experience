import type { HairJourneyChapter as Chapter } from "@/data/hairJourney";
import s from "../sections/CinematicHairJourney.module.css";

export function HairJourneyChapter({
  chapter,
  active,
}: {
  chapter: Chapter;
  active: boolean;
}) {
  return (
    <article
      className={s.chapter}
      data-journey-chapter={chapter.id}
      data-start={chapter.start}
      data-end={chapter.end}
      aria-hidden={!active}
    >
      <span className={s.chapterNumber}>{chapter.number}</span>
      <div className={s.chapterCopy}>
        <h2>
          {chapter.title.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
        <p>{chapter.copy}</p>
        {chapter.id === "color" && (
          <span className={s.currentColor} aria-live="polite">
            <span>COLOR / </span>
            <strong data-journey-color>BLACK</strong>
          </span>
        )}
        {chapter.id === "final" && (
          <span className={s.finalName}>ASH WAVE</span>
        )}
      </div>
    </article>
  );
}
