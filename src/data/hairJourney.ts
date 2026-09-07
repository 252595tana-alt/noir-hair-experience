import type { HairColor } from "./hairStyles";
import type { HairUnwovenStyleId } from "./hairUnwovenStyles";

export type HairJourneyChapterId =
  | "intro"
  | "cut"
  | "color"
  | "treatment"
  | "styling"
  | "final";

export type HairJourneyChapter = {
  id: HairJourneyChapterId;
  number: string;
  navigationLabel: string;
  title: string;
  copy: string;
  start: number;
  end: number;
  background: string;
};

export type HairJourneyColorStop = {
  id: HairColor;
  label: string;
  color: string;
  highlight: string;
};

export const hairJourneyChapters: readonly HairJourneyChapter[] = [
  {
    id: "intro",
    number: "00",
    navigationLabel: "INTRO",
    title: "YOUR HAIR,\nYOUR STORY.",
    copy: "Scroll to transform.",
    start: 0,
    end: 0.12,
    background: "#080808",
  },
  {
    id: "cut",
    number: "01",
    navigationLabel: "CUT",
    title: "CUT",
    copy: "Shape your silhouette.",
    start: 0.12,
    end: 0.3,
    background: "#0b0b0b",
  },
  {
    id: "color",
    number: "02",
    navigationLabel: "COLOR",
    title: "COLOR",
    copy: "Find your tone.",
    start: 0.3,
    end: 0.48,
    background: "#0d0c0b",
  },
  {
    id: "treatment",
    number: "03",
    navigationLabel: "TREATMENT",
    title: "TREATMENT",
    copy: "Restore the shine.",
    start: 0.48,
    end: 0.66,
    background: "#10100f",
  },
  {
    id: "styling",
    number: "04",
    navigationLabel: "STYLING",
    title: "STYLING",
    copy: "Create the movement.",
    start: 0.66,
    end: 0.84,
    background: "#0c0c0c",
  },
  {
    id: "final",
    number: "05",
    navigationLabel: "FINISH",
    title: "THE FINAL STYLE",
    copy: "Form, tone and movement — made yours.",
    start: 0.84,
    end: 1,
    background: "#090909",
  },
] as const;

/**
 * COLOR chapter stops. Shader code consumes this data through its uniforms;
 * the DOM label reads the same array so visual and textual progress agree.
 */
export const hairJourneyColorStops: readonly HairJourneyColorStop[] = [
  {
    id: "black",
    label: "BLACK",
    color: "#171719",
    highlight: "#737273",
  },
  {
    id: "dark-brown",
    label: "DARK BROWN",
    color: "#3a2924",
    highlight: "#a77c68",
  },
  {
    id: "ash",
    label: "ASH",
    color: "#626662",
    highlight: "#bbc1bc",
  },
  {
    id: "beige",
    label: "ASH BEIGE",
    color: "#a28d79",
    highlight: "#e2cfb6",
  },
] as const;

export const hairJourney = {
  eyebrow: "02 / CINEMATIC JOURNEY",
  chapters: hairJourneyChapters,
  colorStops: hairJourneyColorStops,
  finalStyle: {
    title: "ASH WAVE",
    styleId: "perm",
    editorialStyleId: "wave" as HairUnwovenStyleId,
    color: "ash" as HairColor,
    image: "/images/styles-v2/perm.webp",
    imagePosition: "center 24%",
  },
} as const;

export function hairJourneyChapterIndex(progress: number) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  const index = hairJourneyChapters.findIndex(
    (chapter) =>
      safeProgress >= chapter.start && safeProgress < chapter.end,
  );
  return index < 0 ? hairJourneyChapters.length - 1 : index;
}

export function hairJourneyColorLabel(progress: number) {
  const chapter = hairJourneyChapters[2];
  const local = Math.max(
    0,
    Math.min(1, (progress - chapter.start) / (chapter.end - chapter.start)),
  );
  const index = Math.min(
    hairJourneyColorStops.length - 1,
    Math.floor(local * hairJourneyColorStops.length),
  );
  return hairJourneyColorStops[index].label;
}
