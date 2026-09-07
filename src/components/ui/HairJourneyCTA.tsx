import s from "../sections/CinematicHairJourney.module.css";

export function HairJourneyCTA({
  title,
  active,
  onViewStyle,
  onBookStyle,
}: {
  title: string;
  active: boolean;
  onViewStyle: () => void;
  onBookStyle: () => void;
}) {
  return (
    <div
      className={s.finalCta}
      data-journey-cta
      aria-hidden={!active}
    >
      <span className={s.finalCtaLabel}>THE FINAL STYLE</span>
      <strong>{title}</strong>
      <div className={s.finalActions}>
        <button type="button" onClick={onViewStyle} tabIndex={active ? 0 : -1}>
          VIEW STYLE <span aria-hidden="true">↗</span>
        </button>
        <button
          type="button"
          className={s.primaryAction}
          onClick={onBookStyle}
          tabIndex={active ? 0 : -1}
        >
          BOOK THIS STYLE <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
