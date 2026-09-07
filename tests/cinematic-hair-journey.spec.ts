import { expect, test, type Locator, type Page } from "@playwright/test";

const journey = (page: Page) => page.getByTestId("cinematic-hair-journey");

type JourneyChapter =
  | "intro"
  | "cut"
  | "color"
  | "treatment"
  | "styling"
  | "final";

test.beforeEach(async ({ page }) => {
  // The portrait opening has dedicated coverage. Keep this suite focused on
  // the scroll-driven section that follows it.
  await page.addInitScript(() => {
    sessionStorage.setItem("noir-opening-portrait-v4", "1");
  });
});

async function persistedSelection(page: Page) {
  return page.evaluate(() => {
    const saved = localStorage.getItem("noir-selection-v2");
    return saved ? JSON.parse(saved).state : null;
  });
}

async function openJourney(page: Page) {
  await page.goto("/");
  const section = journey(page);
  await expect(section).toHaveAttribute("aria-label", "Cinematic Hair Journey");
  await section.scrollIntoViewIfNeeded();
  await expect(section).toBeVisible();
  return section;
}

async function scrollDesktopJourney(
  page: Page,
  section: Locator,
  progress: number,
  chapter: JourneyChapter,
  sectionTop?: number,
) {
  const top =
    sectionTop ??
    (await section.evaluate(
      (node) => node.getBoundingClientRect().top + window.scrollY,
    ));
  await page.evaluate(
    ({ sectionTop, targetProgress }) => {
      const journeyDistance = window.innerHeight * 4.35;
      window.scrollTo({
        top: sectionTop + journeyDistance * targetProgress,
        behavior: "instant",
      });
    },
    { sectionTop: top, targetProgress: progress },
  );
  await expect
    .poll(() => section.getAttribute("data-active-chapter"))
    .toBe(chapter);
}

async function clickPinnedButton(page: Page, button: Locator) {
  await expect(button).toBeVisible();
  await expect
    .poll(() => button.evaluate((node) => getComputedStyle(node).pointerEvents))
    .toBe("auto");
  let previous: { x: number; y: number } | undefined;
  await expect
    .poll(
      async () => {
        const current = await button.boundingBox();
        if (!current) return false;
        const stable =
          previous !== undefined &&
          Math.abs(current.x - previous.x) < 0.5 &&
          Math.abs(current.y - previous.y) < 0.5;
        previous = { x: current.x, y: current.y };
        return stable;
      },
      { intervals: [100, 160, 240] },
    )
    .toBe(true);
  const bounds = await button.boundingBox();
  expect(bounds).not.toBeNull();
  await expect
    .poll(() =>
      button.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        const target = document.elementFromPoint(
          bounds.left + bounds.width / 2,
          bounds.top + bounds.height / 2,
        );
        return target === node || node.contains(target);
      }),
    )
    .toBe(true);
  // ScrollTrigger pins the stage with transforms. Calling the DOM click after
  // the hit-target assertion avoids Playwright auto-scrolling the pin away.
  await button.evaluate((node) => (node as HTMLButtonElement).click());
}

test("HOME includes the complete Cinematic Hair Journey story", async ({
  page,
}) => {
  const section = await openJourney(page);
  await expect(section).toHaveAttribute(
    "data-active-chapter",
    /^(intro|cut|color|treatment|styling|final)$/,
  );
  await expect(section).toContainText("YOUR HAIR,");
  await expect(section).toContainText("CUT");
  await expect(section).toContainText("COLOR");
  await expect(section).toContainText("TREATMENT");
  await expect(section).toContainText("STYLING");
  await expect(section).toContainText("ASH WAVE");
});

test("desktop scroll advances every chapter and exposes its progress state", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Desktop ScrollTrigger coverage.");
  const section = await openJourney(page);
  // Keep the unpinned section origin. ScrollTrigger translates its pinned child,
  // so deriving this again midway through the story can include that transform.
  const sectionTop = await section.evaluate(
    (node) => node.getBoundingClientRect().top + window.scrollY,
  );
  const stops: Array<[number, JourneyChapter, string]> = [
    [0.04, "intro", "YOUR HAIR,"],
    [0.2, "cut", "Shape your silhouette."],
    [0.39, "color", "Find your tone."],
    [0.57, "treatment", "Restore the shine."],
    [0.75, "styling", "Create the movement."],
    [0.93, "final", "THE FINAL STYLE"],
  ];

  for (const [progress, chapter, copy] of stops) {
    await scrollDesktopJourney(page, section, progress, chapter, sectionTop);
    await expect(section.getByText(copy, { exact: true }).first()).toBeVisible();
    if (chapter !== "intro") {
      await expect(
        section
          .getByRole("navigation", { name: "Hair transformation progress" })
          .locator('[aria-current="step"]'),
      ).toContainText(chapter === "final" ? "FINISH" : chapter.toUpperCase());
    }
  }

  const finalCta = section.locator("[data-journey-cta]");
  await expect(finalCta).toHaveAttribute("aria-hidden", "true");
  await expect(finalCta.getByRole("button", { includeHidden: true }).first()).toHaveAttribute(
    "tabindex",
    "-1",
  );
  await scrollDesktopJourney(page, section, 0.97, "final", sectionTop);
  await expect(finalCta).toHaveAttribute("aria-hidden", "false");
  await expect(finalCta.getByRole("button").first()).toHaveAttribute("tabindex", "0");
});

test("FINAL VIEW and BOOK pass WAVE, ASH and PERM into the existing flow", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Desktop final CTA and cleanup coverage.");
  let section = await openJourney(page);
  await scrollDesktopJourney(page, section, 0.96, "final");
  await clickPinnedButton(
    page,
    section.getByRole("button", { name: /VIEW STYLE/ }),
  );
  await expect(page).toHaveURL(/\/style\/perm$/);
  await expect(page.locator("main")).toHaveAttribute("data-mode", "style");
  await expect
    .poll(() => persistedSelection(page))
    .toMatchObject({
      selectedStyleId: "perm",
      selectedColor: "ash",
      editorialStyleId: "wave",
    });

  section = await openJourney(page);
  await scrollDesktopJourney(page, section, 0.96, "final");
  await clickPinnedButton(
    page,
    section.getByRole("button", { name: /BOOK THIS STYLE/ }),
  );
  await expect(page).toHaveURL(/\/booking$/);
  await expect(page.locator("main")).toHaveAttribute("data-mode", "booking");
  await expect(page.getByTestId("plan-summary")).toContainText("WAVE");
  await expect(page.getByTestId("plan-summary")).toContainText("ASH GRAY");
  await expect
    .poll(() => persistedSelection(page))
    .toMatchObject({
      selectedStyleId: "perm",
      selectedColor: "ash",
      editorialStyleId: "wave",
    });
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});

test("reduced motion presents the whole static story and working CTAs without Canvas", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const section = await openJourney(page);
  await expect(section).toHaveAttribute("data-static", "true");
  await expect(section).toHaveAttribute("data-renderer", "fallback");
  await expect(section.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);

  const staticChapters = [
    ["CUT", "Shape your silhouette."],
    ["COLOR", "Find your tone."],
    ["TREATMENT", "Restore the shine."],
    ["STYLING", "Create the movement."],
    ["THE FINAL STYLE", "Form, tone and movement — made yours."],
  ] as const;
  for (const [title, copy] of staticChapters) {
    const item = section.locator("li").filter({ hasText: copy });
    await expect(item).toBeVisible();
    await expect(item).toContainText(title);
  }
  await expect(section.getByAltText("ASH WAVE hairstyle")).toBeVisible();
  await expect(section.getByRole("button", { name: /VIEW STYLE/ })).toBeVisible();
  await expect(
    section.getByRole("button", { name: /BOOK THIS STYLE/ }),
  ).toBeVisible();
});

test("mobile uses the lightweight scene without a GSAP pin", async ({
  page,
}, info) => {
  test.skip(info.project.name === "desktop", "Touch viewport coverage.");
  const section = await openJourney(page);
  await expect(section).toHaveAttribute("data-static", "false");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);

  const canvas = section.getByTestId("cinematic-hair-canvas");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-segments", "44x3");
  await expect(canvas).toHaveAttribute("data-particles", "14");
  await expect(canvas).toHaveAttribute("data-threads", "24");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});
