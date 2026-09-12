import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("noir-opening-portrait-v4", "1"));
});

async function openLab(page: Page) {
  await page.goto("/");
  const lab = page.getByTestId("hair-material-lab");
  await lab.getByRole("heading").scrollIntoViewIfNeeded();
  await expect(lab).toBeVisible();
  return lab;
}

test("choices stay independent and the exact selection reaches booking after reload", async ({ page }) => {
  const lab = await openLab(page);
  const stored = await page.evaluate(() => localStorage.getItem("noir-selection-v2"));
  await lab.getByRole("radio", { name: "WAVE", exact: true }).check();
  await lab.getByRole("radio", { name: "ASH", exact: true }).check();
  await lab.getByRole("radio", { name: "SILKY", exact: true }).check();
  await expect(lab).toHaveAttribute("data-style", "wave");
  await expect(lab).toHaveAttribute("data-color", "ash");
  await expect(lab).toHaveAttribute("data-texture", "silky");
  expect(await page.evaluate(() => localStorage.getItem("noir-selection-v2"))).toBe(stored);
  await lab.getByRole("link", { name: "BOOK THIS STYLE" }).click();
  await expect(page).toHaveURL(/\/booking\?source=hair-material-lab&style=wave&color=ash&texture=silky$/);
  await page.reload();
  await expect(page.getByTestId("material-booking-selection")).toContainText("WAVE");
  await expect(page.getByTestId("material-booking-selection")).toContainText("ASH");
  await expect(page.getByTestId("material-booking-selection")).toContainText("SILKY");
  await page.getByRole("button", { name: "予約メッセージを確認 →" }).click();
  const message = page.getByRole("textbox", { name: "生成した予約文" });
  await expect(message).toHaveValue(/STYLE: WAVE\nCOLOR: ASH\nTEXTURE: SILKY/);
  await page.getByRole("button", { name: /閉じる/ }).click();
  await page.goto("/booking");
  await expect(page.getByTestId("plan-summary")).toBeVisible();
  await expect(page.getByTestId("material-booking-selection")).toHaveCount(0);
});

test("shader compiles, interpolates material and keeps the shape fixed under pointer light", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const lab = await openLab(page);
  const stage = lab.getByRole("img");
  await stage.scrollIntoViewIfNeeded();
  await expect(lab).toHaveAttribute("data-engine", "webgl", { timeout: 30000 });
  const canvas = lab.locator("canvas");
  await lab.getByRole("button", { name: "光の自動移動" }).click();
  await lab.getByRole("radio", { name: "MATTE", exact: true }).check();
  await stage.scrollIntoViewIfNeeded();
  await expect.poll(async () => Number(await canvas.getAttribute("data-roughness"))).toBeGreaterThan(0.77);
  const matte = await canvas.screenshot();
  await lab.getByRole("radio", { name: "SILKY", exact: true }).check();
  await stage.scrollIntoViewIfNeeded();
  await expect.poll(async () => Number(await canvas.getAttribute("data-roughness"))).toBeLessThan(0.19);
  await expect.poll(async () => Number(await canvas.getAttribute("data-specular"))).toBeGreaterThan(0.85);
  const silky = await canvas.screenshot();
  expect(matte.equals(silky)).toBe(false);
  await lab.getByRole("radio", { name: "WAVE", exact: true }).check();
  await stage.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-wave", "1.0000");
  const wave = await canvas.screenshot();
  expect(silky.equals(wave)).toBe(false);
  if (info.project.name === "desktop") {
    const bounds = (await stage.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width * .2, bounds.y + bounds.height * .3);
    await expect.poll(() => canvas.getAttribute("data-light")).toMatch(/^-/);
    await expect(canvas).toHaveAttribute("data-wave", "1.0000");
  } else {
    await expect(lab.getByTestId("hair-material-canvas")).toHaveAttribute("data-dpr-cap", "1");
    await expect(lab.getByTestId("hair-material-canvas")).toHaveAttribute("data-noise-octaves", "1");
    const size = await canvas.evaluate((node: HTMLCanvasElement) => ({ actual: node.width, css: node.getBoundingClientRect().width }));
    expect(size.actual).toBeLessThanOrEqual(Math.ceil(size.css));
    await lab.getByRole("slider", { name: "光の位置" }).focus();
    await page.keyboard.press("End");
    await stage.scrollIntoViewIfNeeded();
    await expect.poll(async () => Number((await canvas.getAttribute("data-light"))?.split(",")[0])).toBeGreaterThan(0.99);
    await expect(canvas).toHaveAttribute("data-wave", "1.0000");
  }
  await lab.screenshot({ path: `docs/screenshots/hair-material-${info.project.name}.png`,
    style: 'header:not(#hair-material-lab header), nav[aria-label="メインナビゲーション"], nav[aria-label="モバイルナビゲーション"], a[href="#main"] { visibility: hidden !important; }',
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(lab.getByTestId("hair-material-canvas")).toHaveAttribute("data-rendering", "paused");
  const frames = await canvas.getAttribute("data-frames");
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute("data-frames")).toBe(frames);
  expect(errors.filter((error) => !error.includes("favicon"))).toEqual([]);
});

test("keyboard, reduced motion and narrow layouts remain usable", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 740 });
  const lab = await openLab(page);
  await lab.getByRole("radio", { name: "STRAIGHT", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(lab.getByRole("radio", { name: "WAVE", exact: true })).toBeChecked();
  await expect(lab.getByRole("button", { name: "光の自動移動" })).toBeDisabled();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  const results = await new AxeBuilder({ page }).include("#hair-material-lab").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("WebGL failure preserves choices and booking", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.includes("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  const lab = await openLab(page);
  await expect(lab).toHaveAttribute("data-engine", "fallback");
  await lab.getByRole("radio", { name: "BEIGE", exact: true }).check();
  await lab.getByRole("link", { name: "BOOK THIS STYLE" }).click();
  await expect(page.getByTestId("material-booking-selection")).toContainText("BEIGE");
});

test("context loss switches only the Lab to its static preview", async ({ page }) => {
  const lab = await openLab(page);
  await lab.getByRole("img").scrollIntoViewIfNeeded();
  await expect(lab).toHaveAttribute("data-engine", "webgl", { timeout: 30000 });
  await lab.locator("canvas").evaluate((canvas) => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(lab).toHaveAttribute("data-engine", "fallback");
  await expect(lab.getByRole("link", { name: "BOOK THIS STYLE" })).toBeEnabled();
});
