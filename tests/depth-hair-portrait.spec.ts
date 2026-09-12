import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("noir-opening-portrait-v4", "1"));
});
async function openPortrait(page: Page) {
  await page.goto("/");
  const section = page.getByTestId("depth-hair-portrait");
  await section.getByRole("img").scrollIntoViewIfNeeded();
  await expect(section).toBeVisible();
  return section;
}

test("selection persists without changing the Gallery and reaches booking after reload", async ({ page }) => {
  let section = await openPortrait(page);
  const previous = await page.evaluate(() => localStorage.getItem("noir-selection-v2"));
  await section.getByRole("radio", { name: "ASH", exact: true }).check();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("noir-depth-portrait-v1")!))).toEqual({ style: "silk-straight", color: "ash" });
  expect(await page.evaluate(() => localStorage.getItem("noir-selection-v2"))).toBe(previous);
  await page.reload();
  section = page.getByTestId("depth-hair-portrait");
  await expect(section.getByRole("radio", { name: "ASH", exact: true })).toBeChecked();
  await section.getByRole("link", { name: "BOOK THIS STYLE" }).click();
  await expect(page).toHaveURL(/source=depth-hair-portrait&style=silk-straight&color=ash$/);
  await page.reload();
  await expect(page.getByTestId("portrait-booking-selection")).toContainText("SILK STRAIGHT");
  await expect(page.getByTestId("portrait-booking-selection")).toContainText("ASH");
  await expect(page.getByTestId("material-booking-selection")).toHaveCount(0);
  await page.getByRole("button", { name: "予約メッセージを確認 →" }).click();
  await expect(page.getByRole("textbox", { name: "生成した予約文" })).toHaveValue(/STYLE: SILK STRAIGHT\nCOLOR: ASH/);
});

test("GPU color changes affect hair while preserving face, clothing and background pixels", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const section = await openPortrait(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(section).toHaveAttribute("data-engine", "webgl", { timeout: 20000 });
  const canvas = section.locator("canvas");
  // Keep the entire photograph clear of fixed navigation. scrollIntoViewIfNeeded
  // can leave different portions under the header after tapping mobile controls.
  const centerPhoto = () => section.getByRole("img").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await section.getByRole("radio", { name: "BEIGE", exact: true }).check();
  await centerPhoto();
  await expect(canvas).toHaveAttribute("data-exposure", "0.930");
  const before = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  await section.getByRole("radio", { name: "BLACK", exact: true }).check();
  await centerPhoto();
  await expect(canvas).toHaveAttribute("data-exposure", "0.105");
  const after = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  expect([after.info.width, after.info.height]).toEqual([before.info.width, before.info.height]);
  const difference = (x: number, y: number) => {
    const px = Math.floor(x / 1024 * before.info.width), py = Math.floor(y / 1536 * before.info.height);
    const index = (py * before.info.width + px) * before.info.channels;
    return [0, 1, 2].reduce((sum, channel) => sum + Math.abs(before.data[index + channel] - after.data[index + channel]), 0);
  };
  for (const [x, y] of [[510, 650], [510, 1200], [70, 100]]) expect(difference(x, y)).toBeLessThan(5);
  expect(difference(320, 650)).toBeGreaterThan(60);
  await page.screenshot({ path: `docs/screenshots/depth-portrait-${info.project.name}.png` });
  await section.getByRole("button", { name: /COMPARE ORIGINAL/ }).click();
  await centerPhoto();
  await expect(canvas).toHaveAttribute("data-original", "1.000");
  await expect(section.getByRole("radio", { name: "BLACK", exact: true })).toBeChecked();
  expect(errors).toEqual([]);
});

test("depth reacts to pointer or touch, uses mobile budgets and pauses offscreen", async ({ page }, info) => {
  const section = await openPortrait(page);
  await expect(section).toHaveAttribute("data-engine", "webgl", { timeout: 20000 });
  const renderer = section.getByTestId("depth-portrait-canvas"), canvas = section.locator("canvas");
  const bounds = (await section.getByRole("img").boundingBox())!;
  if (info.project.name === "desktop") {
    await page.mouse.move(bounds.x + bounds.width * .2, bounds.y + bounds.height * .4);
    await expect.poll(() => canvas.getAttribute("data-pointer")).toMatch(/^-/);
    await expect(renderer).toHaveAttribute("data-segments", "100x150");
  } else {
    const client = await page.context().newCDPSession(page);
    const x = bounds.x + bounds.width * .3, y = Math.max(130, bounds.y + bounds.height * .5);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + bounds.width * .5, y }] });
    await expect.poll(async () => Number((await canvas.getAttribute("data-pointer"))?.split(",")[0])).toBeGreaterThan(.2);
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await client.detach();
    await expect(renderer).toHaveAttribute("data-segments", "36x54");
    await expect(renderer).toHaveAttribute("data-dpr-cap", "1.25");
    await expect(renderer).toHaveAttribute("data-noise-octaves", "1");
    await expect(canvas).toHaveAttribute("data-strength", "0.450");
    const dpr = await canvas.evaluate((node: HTMLCanvasElement) => node.width / node.getBoundingClientRect().width);
    expect(dpr).toBeLessThanOrEqual(1.255);
    await section.getByRole("img").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    const touchBounds = (await section.getByRole("img").boundingBox())!;
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const scrollTouch = await page.context().newCDPSession(page);
    const sx = touchBounds.x + touchBounds.width / 2, sy = touchBounds.y + touchBounds.height * .65;
    await scrollTouch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: sx, y: sy }] });
    for (let step = 1; step <= 6; step++) await scrollTouch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: sx, y: sy - step * 20 }] });
    await scrollTouch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore + 50);
    await scrollTouch.detach();
  }
  await page.mouse.move(0, 0);
  await section.getByRole("button", { name: "奥行き効果" }).click();
  await section.getByRole("img").scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-strength", "0.000");
  await expect(canvas).toHaveAttribute("data-textures", "3");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(renderer).toHaveAttribute("data-rendering", "paused");
  const frames = await canvas.getAttribute("data-frames");
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute("data-frames")).toBe(frames);
});

test("keyboard, 320px layout, reduced motion and accessibility", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 740 });
  const section = await openPortrait(page);
  await section.getByRole("radio", { name: "BEIGE", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(section.getByRole("radio", { name: "ASH", exact: true })).toBeChecked();
  await expect(section.getByRole("button", { name: "奥行き効果" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  const axe = await new AxeBuilder({ page }).include("#depth-hair-portrait").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
});

test("missing depth map and context loss retain color selection and booking", async ({ page }) => {
  await page.route("**/images/depth-portrait/depth*.png", (route) => route.abort());
  const section = await openPortrait(page);
  await expect(section).toHaveAttribute("data-engine", "fallback");
  await section.getByRole("radio", { name: "BROWN", exact: true }).check();
  await section.getByRole("link", { name: "BOOK THIS STYLE" }).click();
  await expect(page.getByTestId("portrait-booking-selection")).toContainText("BROWN");
  await page.unroute("**/images/depth-portrait/depth*.png");
  const restored = await openPortrait(page);
  await expect(restored).toHaveAttribute("data-engine", "webgl", { timeout: 20000 });
  await restored.locator("canvas").evaluate((node) => node.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(restored).toHaveAttribute("data-engine", "fallback");
  await expect(restored.getByRole("radio", { name: "BROWN", exact: true })).toBeChecked();
});
