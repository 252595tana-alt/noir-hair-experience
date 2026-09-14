import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("noir-opening-portrait-v4", "1"));
});
async function openReveal(page: Page) {
  await page.goto("/color-reveal");
  const section = page.getByTestId("hair-color-particle-reveal");
  await section.getByRole("img").scrollIntoViewIfNeeded();
  return section;
}
test("TOP keeps a lightweight entry and transitions to the dedicated experience", async ({ page }) => {
  await page.goto("/");
  const entry = page.getByTestId("color-reveal-entry");
  await entry.scrollIntoViewIfNeeded();
  await expect(entry).toBeVisible();
  await expect(page.getByTestId("hair-color-particle-reveal")).toHaveCount(0);
  await expect(entry.locator("canvas")).toHaveCount(0);
  await entry.getByRole("link", { name: "COLORを試す" }).click();
  await expect(page).toHaveURL(/\/color-reveal$/);
  await expect(page.locator("main")).toHaveAttribute("data-mode", "reveal");
  await expect(page.getByTestId("hair-color-particle-reveal")).toBeVisible();
  await expect(page.getByLabel("現在の選択")).toHaveCount(0);
});
test("five colors persist and the final style/color reach booking and LINE text", async ({ page }) => {
  let section = await openReveal(page);
  for (const name of ["BLACK", "BROWN", "ASH", "BEIGE", "SILVER"]) {
    await section.getByRole("radio", { name, exact: true }).check();
    await expect(section).toHaveAttribute("data-color", name.toLowerCase());
  }
  await page.reload();
  section = page.getByTestId("hair-color-particle-reveal");
  await expect(section.getByRole("radio", { name: "SILVER", exact: true })).toBeChecked();
  await section.getByRole("link", { name: "BOOK THIS COLOR" }).click();
  await expect(page).toHaveURL(/source=hair-color-particle-reveal&style=silk-straight&color=silver$/);
  await page.reload();
  await expect(page.getByTestId("reveal-booking-selection")).toContainText("SILK STRAIGHT");
  await expect(page.getByTestId("reveal-booking-selection")).toContainText("SILVER");
  await expect(page.getByTestId("portrait-booking-selection")).toHaveCount(0);
  await page.getByRole("button", { name: "予約メッセージを確認 →" }).click();
  await expect(page.getByRole("textbox", { name: "生成した予約文" })).toHaveValue(/STYLE: SILK STRAIGHT\nCOLOR: SILVER/);
});

for (const backend of ["webgpu", "webgl"] as const) {
  test(`${backend}: hair-only pixels, GPU dust, interrupted transitions and idle suspension`, async ({ page }, info) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    if (backend === "webgl") await page.addInitScript(() => Object.defineProperty(navigator, "gpu", { value: undefined, configurable: true }));
    await page.emulateMedia({ reducedMotion: "reduce" });
    const section = await openReveal(page);
    await expect(section).toHaveAttribute("data-engine", backend, { timeout: 25000 });
    const canvas = section.locator("canvas");
    const center = () => section.getByRole("img").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await section.getByRole("radio", { name: "BEIGE", exact: true }).check(); await center();
    await expect(canvas).toHaveAttribute("data-progress", "1.000");
    const before = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    await section.getByRole("radio", { name: "BLACK", exact: true }).check(); await center();
    const after = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const difference = (x: number, y: number) => {
      const px = Math.floor(x / 1024 * before.info.width), py = Math.floor(y / 1536 * before.info.height);
      const index = (py * before.info.width + px) * before.info.channels;
      return [0, 1, 2].reduce((sum, ch) => sum + Math.abs(before.data[index + ch] - after.data[index + ch]), 0);
    };
    for (const [x, y] of [[510, 650], [510, 1200], [70, 100]]) expect(difference(x, y)).toBeLessThan(5);
    expect(difference(320, 650)).toBeGreaterThan(60);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await section.getByRole("radio", { name: "SILVER", exact: true }).check();
    await expect.poll(async () => Number(await canvas.getAttribute("data-progress"))).toBeGreaterThan(.05);
    expect(Number(await canvas.getAttribute("data-progress"))).toBeLessThan(.95);
    await section.getByRole("radio", { name: "BROWN", exact: true }).check();
    await section.getByRole("radio", { name: "ASH", exact: true }).check();
    await center();
    await expect(canvas).toHaveAttribute("data-progress", "1.000");
    await expect(section.getByRole("radio", { name: "ASH", exact: true })).toBeChecked();
    const dispatched = Number(await canvas.getAttribute("data-dispatches"));
    if (backend === "webgpu") expect(dispatched).toBeGreaterThan(10); else expect(dispatched).toBe(0);
    const idle = await canvas.getAttribute("data-frames");
    await page.waitForTimeout(180);
    expect(await canvas.getAttribute("data-frames")).toBe(idle);
    await page.screenshot({ path: `docs/screenshots/color-reveal-${backend}-${info.project.name}.png` });
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(section.getByTestId("color-reveal-canvas")).toHaveAttribute("data-rendering", "paused");
    const paused = await canvas.getAttribute("data-frames");
    await page.waitForTimeout(180);
    expect(await canvas.getAttribute("data-frames")).toBe(paused);
    expect(errors).toEqual([]);
  });
}

test("responsive budgets, keyboard and reduced motion remain accessible", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const section = await openReveal(page), renderer = section.getByTestId("color-reveal-canvas");
  await expect(section).toHaveAttribute("data-engine", /webgpu|webgl/);
  await expect(renderer).toHaveAttribute("data-count", info.project.name === "desktop" ? "12000" : "2400");
  await expect(renderer).toHaveAttribute("data-dpr-cap", info.project.name === "desktop" ? "1.5" : "1");
  await expect(renderer).toHaveAttribute("data-noise-octaves", info.project.name === "desktop" ? "3" : "1");
  await section.getByRole("radio", { name: "BEIGE", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(section.getByRole("radio", { name: "SILVER", exact: true })).toBeChecked();
  await expect(section.getByRole("button", { name: "カラーの粒子アニメーション" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect((await new AxeBuilder({ page }).include("#hair-color-particle-reveal").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

test("missing assets and context loss keep the color picker and booking usable", async ({ page }) => {
  await page.route("**/images/color-reveal/flow*.png", (route) => route.abort());
  let section = await openReveal(page);
  await expect(section).toHaveAttribute("data-engine", "fallback");
  await section.getByRole("radio", { name: "BROWN", exact: true }).check();
  await section.getByRole("link", { name: "BOOK THIS COLOR" }).click();
  await expect(page.getByTestId("reveal-booking-selection")).toContainText("BROWN");
  await page.unroute("**/images/color-reveal/flow*.png");
  section = await openReveal(page);
  await expect(section).toHaveAttribute("data-engine", /webgpu|webgl/);
  await section.locator("canvas").evaluate((node) => node.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(section).toHaveAttribute("data-engine", "fallback");
  await expect(section.getByRole("radio", { name: "BROWN", exact: true })).toBeChecked();
});

test("blocked localStorage still retains the latest selection through navigation", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("Storage blocked"); };
    Storage.prototype.setItem = () => { throw new Error("Storage blocked"); };
  });
  const section = await openReveal(page);
  await section.getByRole("radio", { name: "SILVER", exact: true }).check();
  await expect(section.getByRole("radio", { name: "SILVER", exact: true })).toBeChecked();
  await section.getByRole("link", { name: "BOOK THIS COLOR" }).click();
  await expect(page.getByTestId("reveal-booking-selection")).toContainText("SILVER");
});

test("unavailable graphics still provide a static preview and a valid booking", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "gpu", { value: undefined, configurable: true });
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return getContext.apply(this, [type, ...args] as Parameters<typeof getContext>);
    } as typeof getContext;
  });
  const section = await openReveal(page);
  await expect(section).toHaveAttribute("data-engine", "fallback");
  await section.getByRole("radio", { name: "ASH", exact: true }).check();
  await section.getByRole("link", { name: "BOOK THIS COLOR" }).click();
  await expect(page.getByTestId("reveal-booking-selection")).toContainText("ASH");
  expect(errors).toEqual([]);
});

test("leaving the experience releases its WebGPU device and returning restores selection", async ({ page }) => {
  await page.addInitScript(() => {
    const runtime = window as unknown as { GPUDevice: { prototype: { destroy: () => void } }; revealDeviceDisposals: number };
    runtime.revealDeviceDisposals = 0;
    const destroy = runtime.GPUDevice.prototype.destroy;
    runtime.GPUDevice.prototype.destroy = function () { runtime.revealDeviceDisposals++; return destroy.call(this); };
  });
  const section = await openReveal(page);
  await expect(section).toHaveAttribute("data-engine", "webgpu");
  await section.getByRole("radio", { name: "SILVER", exact: true }).check();
  await section.getByRole("link", { name: "BOOK THIS COLOR" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { revealDeviceDisposals: number }).revealDeviceDisposals)).toBeGreaterThan(0);
  await page.goBack();
  await section.getByRole("img").scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute("data-engine", "webgpu");
  await expect(section.getByRole("radio", { name: "SILVER", exact: true })).toBeChecked();
});
