import { test, expect, type Locator, type Page } from "@playwright/test";
import { styles } from "../src/data/styles";

// Gallery titles are editorial names; their booking targets use existing STYLE IDs.
const works = [
  { id: "straight", title: "STRAIGHT", styleId: "long" },
  { id: "wave", title: "WAVE", styleId: "perm" },
  { id: "bob", title: "BOB", styleId: "bob" },
  { id: "long", title: "LONG", styleId: "layer" },
] as const;
const gallery = (page: Page) => page.getByTestId("hair-unwoven-gallery");
const savedSelection = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("noir-selection-v2") ?? "{}").state,
  );

test.beforeEach(async ({ page }) => {
  // The existing HERO opening has its own tests. Start directly at the gallery.
  await page.addInitScript(() => {
    sessionStorage.setItem("noir-opening-portrait-v4", "1");
  });
});

async function openGallery(page: Page) {
  await page.goto("/");
  const region = gallery(page);
  await expect(region).toHaveAttribute("aria-label", "Hair Unwoven Gallery");
  await region.scrollIntoViewIfNeeded();
  await expect(region).toBeVisible();
  await expect(region).toHaveAttribute("data-current-style", /^(straight|wave|bob|long)$/);
  return region;
}

async function currentWork(region: Locator) {
  const id = await region.getAttribute("data-current-style");
  const work = works.find((item) => item.id === id);
  expect(work, `Unknown gallery style: ${id}`).toBeDefined();
  return work!;
}

async function step(region: Locator, direction: 1 | -1) {
  const current = await currentWork(region);
  const index = works.findIndex((item) => item.id === current.id);
  const next = works[(index + direction + works.length) % works.length];
  const button = region.getByRole("button", {
    name: direction === 1 ? "NEXT STYLE" : "PREVIOUS STYLE",
    exact: true,
  });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(region).toHaveAttribute("data-current-style", next.id);
  return next;
}

async function selectWork(region: Locator, id: string) {
  for (let attempts = 0; attempts < works.length; attempts++) {
    if ((await currentWork(region)).id === id) return;
    await step(region, 1);
  }
  throw new Error(`Unable to select gallery style ${id}`);
}

async function seedExistingSelection(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "noir-selection-v2",
      JSON.stringify({
        version: 2,
        state: {
          selectedStyleId: "long-wolf",
          selectedColor: "silver",
          selectedAngle: 4,
          selectedStylistId: "takuya",
          optionalMenus: ["treatment"],
          colorChosen: true,
          consultation: false,
        },
      }),
    );
  });
}

async function touchSwipe(page: Page, stage: Locator, dx: number, dy = 0) {
  await stage.scrollIntoViewIfNeeded();
  const bounds = await stage.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width * 0.7;
  const y = bounds!.y + bounds!.height * 0.45;
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let i = 1; i <= 8; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + (dx * i) / 8, y: y + (dy * i) / 8 }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await cdp.detach();
  }
}

test("HOME gallery presents four distinct works and NEXT wraps without changing the booking selection", async ({ page }) => {
  const region = await openGallery(page);
  await expect(region.getByRole("heading", { name: "HAIR STYLE", exact: true })).toBeVisible();
  const before = await savedSelection(page);
  const initial = await currentWork(region);
  const visited = new Set<string>();
  for (let i = 0; i < works.length; i++) {
    const work = await currentWork(region);
    visited.add(work.id);
    await expect(region.getByRole("button", { name: `VIEW STYLE — ${work.title}`, exact: true })).toBeVisible();
    await expect(region.getByRole("button", { name: `BOOK THIS STYLE — ${work.title}`, exact: true })).toBeVisible();
    await step(region, 1);
  }
  expect([...visited].sort()).toEqual(works.map((work) => work.id).sort());
  await expect(region).toHaveAttribute("data-current-style", initial.id);
  expect(await savedSelection(page)).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("PREVIOUS wraps and the gallery is operable with arrow keys", async ({ page }) => {
  const region = await openGallery(page);
  const initial = await currentWork(region);
  await step(region, -1);
  await expect(region.getByRole("button", { name: "NEXT STYLE", exact: true })).toBeEnabled();
  await region.focus();
  await expect(region).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(region).toHaveAttribute("data-current-style", initial.id);
  await expect(region.getByRole("button", { name: "PREVIOUS STYLE", exact: true })).toBeEnabled();
  await region.focus();
  await page.keyboard.press("ArrowLeft");
  const index = works.findIndex((work) => work.id === initial.id);
  await expect(region).toHaveAttribute("data-current-style", works[(index + 3) % 4].id);
});

test("desktop wheel and mouse drag both advance the ribbon gallery", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Desktop pointer and wheel coverage.");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const region = await openGallery(page);
  const stage = region.getByTestId("hair-unwoven-stage");
  const bounds = await stage.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width * 0.68;
  const y = bounds!.y + bounds!.height * 0.5;
  await page.mouse.move(x, y);
  await page.mouse.wheel(72, 0);
  await expect(region).toHaveAttribute("data-current-style", "wave");
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 120, y + 3, { steps: 8 });
  await page.mouse.up();
  await expect(region).toHaveAttribute("data-current-style", "bob");
  expect(errors).toEqual([]);
});

test("rapid directional input leaves a valid work and a usable BOOK action", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const region = await openGallery(page);
  await region.focus();
  for (let i = 0; i < 16; i++)
    await page.keyboard.press(i % 3 === 0 ? "ArrowLeft" : "ArrowRight");
  await expect(region).toHaveAttribute("data-current-style", /^(straight|wave|bob|long)$/);
  await expect(region).toHaveAttribute("aria-busy", "false");
  const book = region.getByRole("button", { name: /^BOOK THIS STYLE — (STRAIGHT|WAVE|BOB|LONG)$/ });
  await expect(book).toBeEnabled();
  await book.click();
  await expect(page).toHaveURL(/\/booking$/);
  expect(works.map((work) => work.styleId)).toContain((await savedSelection(page)).selectedStyleId);
  await expect(page.getByTestId("plan-summary")).toBeVisible();
  expect(errors).toEqual([]);
});

test("each VIEW maps to its existing STYLE deep link and preserves compatible choices", async ({ page }) => {
  test.setTimeout(60000);
  await seedExistingSelection(page);
  for (const work of works) {
    const region = await openGallery(page);
    await selectWork(region, work.id);
    await region.getByRole("button", { name: `VIEW STYLE — ${work.title}`, exact: true }).click();
    const style = styles.find((item) => item.id === work.styleId)!;
    await expect(page).toHaveURL(new RegExp(`/style/${style.slug}$`));
    await expect(page.locator("main")).toHaveAttribute("data-mode", "style");
    await expect(page.getByRole("heading", { name: style.name, exact: true })).toBeVisible();
    expect(await savedSelection(page)).toMatchObject({
      selectedStyleId: style.id,
      selectedColor: style.availableColors.includes("silver") ? "silver" : style.defaultColor,
      selectedAngle: 4,
      selectedStylistId: style.stylistId,
      optionalMenus: ["treatment"],
    });
    await expect(page.getByRole("button", { name: /360° VIEW/ })).toBeVisible();
  }
});

test("each BOOK carries the gallery target, stylist, menu and estimate into booking", async ({ page }) => {
  test.setTimeout(60000);
  await seedExistingSelection(page);
  for (const work of works) {
    const region = await openGallery(page);
    await selectWork(region, work.id);
    await region.getByRole("button", { name: `BOOK THIS STYLE — ${work.title}`, exact: true }).click();
    const style = styles.find((item) => item.id === work.styleId)!;
    await expect(page).toHaveURL(/\/booking$/);
    await expect(page.locator("main")).toHaveAttribute("data-mode", "booking");
    await expect(page.getByTestId("plan-summary")).toContainText(work.title);
    await expect(page.getByTestId("plan-summary")).toContainText("TREATMENT");
    await expect(page.getByTestId("estimated-price")).toHaveText(/¥[\d,]+〜/);
    await expect(page.getByTestId("estimated-time")).toHaveText(/\d+–\d+ MIN/);
    expect(await savedSelection(page)).toMatchObject({
      selectedStyleId: style.id,
      editorialStyleId: work.id,
      selectedAngle: 4,
      selectedStylistId: style.stylistId,
      optionalMenus: ["treatment"],
    });
    await expect(gallery(page)).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
  }
});

test("reduced motion uses the DOM gallery and retains VIEW and BOOK", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const region = await openGallery(page);
  await expect(region.locator("canvas")).toHaveCount(0);
  await expect(region.locator("img").first()).toBeVisible();
  const work = await step(region, 1);
  await region.getByRole("button", { name: `VIEW STYLE — ${work.title}`, exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("data-mode", "style");
  await page.getByRole("button", { name: "BOOK THIS LOOK", exact: true }).click();
  await expect(page).toHaveURL(/\/booking$/);
  expect((await savedSelection(page)).selectedStyleId).toBe(work.styleId);
});

test("WebGL unavailable preserves static artwork and the complete booking flow", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const region = await openGallery(page);
  await expect(region.locator("canvas")).toHaveCount(0);
  await expect(region.locator("img").first()).toBeVisible();
  const work = await step(region, -1);
  await region.getByRole("button", { name: `BOOK THIS STYLE — ${work.title}`, exact: true }).click();
  await expect(page).toHaveURL(/\/booking$/);
  expect((await savedSelection(page)).selectedStyleId).toBe(work.styleId);
  await page.getByRole("button", { name: "予約メッセージを確認 →", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "生成した予約文" })).toHaveValue(new RegExp(`${work.title}のスタイル`));
  expect(errors).toEqual([]);
});

test("mobile horizontal swipe changes the work while vertical swipe scrolls normally", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Real touch events are exercised by mobile and tablet projects.");
  const region = await openGallery(page);
  const stage = page.getByTestId("hair-unwoven-stage");
  const before = await currentWork(region);
  const index = works.findIndex((work) => work.id === before.id);
  await touchSwipe(page, stage, -150);
  await expect(region).toHaveAttribute("data-current-style", works[(index + 1) % 4].id);
  await expect(region.getByRole("button", { name: "NEXT STYLE", exact: true })).toBeEnabled();
  const current = await currentWork(region);
  await stage.scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await touchSwipe(page, stage, 0, 140);
  await expect(region).toHaveAttribute("data-current-style", current.id);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(scrollBefore);
});

test("leaving the gallery removes its canvas and listeners without changing the selected plan", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const region = await openGallery(page);
  const work = await step(region, 1);
  await region.getByRole("button", { name: `BOOK THIS STYLE — ${work.title}`, exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("data-mode", "booking");
  await expect(gallery(page)).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  const before = await savedSelection(page);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowLeft");
  expect(await savedSelection(page)).toEqual(before);
  await page.goBack();
  await expect(page.locator("main")).toHaveAttribute("data-mode", "home");
  await expect(gallery(page)).toHaveCount(1);
  await gallery(page).scrollIntoViewIfNeeded();
  await step(gallery(page), 1);
  expect(await savedSelection(page)).toEqual(before);
  expect(errors).toEqual([]);
});

test("ribbon rendering stays bounded, pauses with SALON, resizes, and falls back after context loss", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Desktop WebGL lifecycle coverage.");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const region = await openGallery(page);
  const loom = region.getByTestId("hair-loom-canvas");
  await expect(loom).toHaveAttribute("data-ribbons", /^(40|60)$/);
  await expect(region).toHaveAttribute("data-renderer", "webgl");
  const canvas = loom.locator("canvas");
  await expect(canvas).toBeVisible();

  const frozen = await currentWork(region);
  const frozenIndex = works.findIndex((work) => work.id === frozen.id);
  await region.getByRole("button", { name: "NEXT STYLE" }).click();
  await page
    .getByRole("button", { name: /SALON \/ ACCESS/ })
    .first()
    .evaluate((button) => (button as HTMLButtonElement).click());
  await expect(region.locator("[data-rendering]")).toHaveAttribute("data-rendering", "paused");
  await page.waitForTimeout(1600);
  await expect(region).toHaveAttribute("data-current-style", frozen.id);
  await page.keyboard.press("Escape");
  await expect(region.locator("[data-rendering]")).toHaveAttribute("data-rendering", "active");
  await expect(region).toHaveAttribute("data-current-style", works[(frozenIndex + 1) % works.length].id);

  for (let index = 0; index < 6; index++) await step(region, 1);
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-textures")))
    .toBeGreaterThan(0);
  expect(Number(await canvas.getAttribute("data-textures"))).toBeLessThanOrEqual(4);

  await page.setViewportSize({ width: 1180, height: 820 });
  await region.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await canvas.evaluate((element) => {
    const gl = (element as HTMLCanvasElement).getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(region.locator("canvas")).toHaveCount(0);
  await expect(region.locator("img").first()).toBeVisible();
  await step(region, 1);
  expect(errors).toEqual([]);
});
