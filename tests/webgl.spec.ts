import { test, expect, type Locator, type Page } from "@playwright/test";
const selection = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("noir-selection-v2")!).state,
  );

async function expectSourceWidthAtLeast(image: Locator, width: number) {
  await expect
    .poll(async () => {
      const currentSrc = await image.evaluate(
        (element) => (element as HTMLImageElement).currentSrc,
      );
      return Number(currentSrc.match(/-(\d+)\.(?:avif|webp|jpg)$/)?.[1] ?? 0);
    })
    .toBeGreaterThanOrEqual(width);
}

test("COLOR serves eight distinct high-resolution responsive angle frames", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Desktop sizes select the 640px-or-larger COLOR rendition",
  );
  await page.goto("/color?style=long-wolf&color=black");
  const viewer = page.getByTestId("hair-viewer");
  const image = viewer.locator("img").first();
  const sources = new Set<string>();

  for (let angle = 1; angle <= 8; angle++) {
    const frame = String(angle).padStart(2, "0");
    await page.getByRole("button", { name: `角度 ${angle}`, exact: true }).click();
    await expect
      .poll(() =>
        image.evaluate((node) => {
          const currentSrc = (node as HTMLImageElement).currentSrc;
          return currentSrc ? new URL(currentSrc).pathname : "";
        }),
      )
      .toContain(`/hair/black/${frame}-`);
    await expectSourceWidthAtLeast(image, 640);
    sources.add(
      await image.evaluate((node) =>
        new URL((node as HTMLImageElement).currentSrc).pathname,
      ),
    );
  }

  expect(sources.size).toBe(8);
  const avifSet = await viewer
    .locator('picture source[type="image/avif"]')
    .first()
    .getAttribute("srcset");
  for (const width of [320, 480, 640, 768])
    expect(avifSet).toContain(`-${width}.avif ${width}w`);
});

test("TRY is separate from selection, APPLY keeps angle, and comparison is keyboard accessible", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/color?style=long-wolf&color=black");
  await page.getByRole("button", { name: "角度 5", exact: true }).click();
  await page.getByRole("button", { name: "SILVER", exact: true }).click();
  expect((await selection(page)).selectedColor).toBe("black");
  await expect(page.getByTestId("color-comparison")).toBeVisible();
  const slider = page.getByRole("slider", {
    name: "BEFORE / AFTER カラー比較",
  });
  await expect(slider).toBeVisible();
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("51");
  if (info.project.name !== "desktop") {
    await slider.scrollIntoViewIfNeeded();
    const bounds = (await slider.boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    const x = bounds.x + bounds.width * 0.4,
      y = bounds.y + bounds.height / 2;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let step = 1; step <= 6; step++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + bounds.width * 0.06 * step, y }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
    expect(Number(await slider.inputValue())).toBeGreaterThan(65);
    expect((await selection(page)).selectedAngle).toBe(4);
  } else {
    await expect(page.getByTestId("color-comparison")).toHaveAttribute(
      "data-comparison",
      "lens",
    );
    await expect(slider.locator("xpath=..")).toHaveAttribute(
      "data-visual",
      "veil",
    );
    await expect(page.locator("canvas")).toHaveCount(1);
    const viewer = await page.getByTestId("hair-viewer").boundingBox();
    await page.mouse.move(
      viewer!.x + viewer!.width * 0.65,
      viewer!.y + viewer!.height * 0.4,
    );
    await page.waitForTimeout(1000);
  }
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: `test-results/${info.project.name}-phase3-compare.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "APPLY SILVER", exact: true }).click();
  expect((await selection(page)).selectedColor).toBe("silver");
  expect((await selection(page)).selectedAngle).toBe(4);
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "BOOK THIS LOOK" }).click();
  await expect(page.getByTestId("plan-summary")).toContainText("SILVER");
  await expect(page.locator("canvas")).toHaveCount(0);
  const bookingImage = page.getByTestId("booking-image");
  const bookingMinimum =
    info.project.name === "mobile"
      ? 640
      : info.project.name === "tablet"
        ? 320
        : 480;
  await expectSourceWidthAtLeast(bookingImage, bookingMinimum);
  const bookingAvif = bookingImage
    .locator("xpath=..")
    .locator('source[type="image/avif"]');
  await expect(bookingAvif).toHaveAttribute(
    "sizes",
    "(max-width:700px) 88vw, 30vw",
  );
  const bookingAvifSet = await bookingAvif.getAttribute("srcset");
  expect(bookingAvifSet).toContain("-768.avif 768w");
  expect(errors).toEqual([]);
});
test("WebGL unavailable preserves the complete DOM flow", async ({
  page,
}) => {
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
  await page.goto("/color?style=long-wolf&color=black");
  await page.getByRole("button", { name: "PINK", exact: true }).click();
  await expect(page.getByRole("slider")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "APPLY PINK", exact: true }).click();
  await page.getByRole("button", { name: "BOOK THIS LOOK" }).click();
  await expect(page.getByTestId("plan-summary")).toContainText("PINK");
  await page.getByRole("button", { name: "LINEで予約" }).click();
  await expect(
    page.getByRole("textbox", { name: "生成した予約文" }),
  ).toHaveValue(/PINK/);
});

test("reduced motion keeps COLOR comparison in the complete DOM flow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/color?style=long-wolf&color=black");
  await page.getByRole("button", { name: "角度 5", exact: true }).click();
  await page.getByRole("button", { name: "PINK", exact: true }).click();
  await expect(page.getByTestId("color-comparison")).toHaveAttribute(
    "data-comparison",
    "slider",
  );
  await expect(
    page.getByRole("slider", { name: "BEFORE / AFTER カラー比較" }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "APPLY PINK", exact: true }).click();
  expect((await selection(page)).selectedColor).toBe("pink");
  expect((await selection(page)).selectedAngle).toBe(4);
});
test("low hardware tier uses slider without image shaders", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 }),
  );
  await page.goto("/color?style=long-wolf&color=black");
  await page.getByRole("button", { name: "SILVER", exact: true }).click();
  await expect(page.getByTestId("color-comparison")).toHaveAttribute(
    "data-comparison",
    "slider",
  );
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("Save-Data keeps COLOR comparison in the complete DOM flow", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: {
        saveData: true,
        effectiveType: "4g",
        addEventListener() {},
        removeEventListener() {},
      },
    }),
  );
  await page.goto("/color?style=long-wolf&color=black");
  await page.getByRole("button", { name: "SILVER", exact: true }).click();
  await expect(page.getByTestId("color-comparison")).toHaveAttribute(
    "data-comparison",
    "slider",
  );
  await expect(
    page.getByRole("slider", { name: "BEFORE / AFTER カラー比較" }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect((await selection(page)).selectedColor).toBe("black");
  await page.getByRole("button", { name: "APPLY SILVER", exact: true }).click();
  expect((await selection(page)).selectedColor).toBe("silver");
});
test("opening is skippable, once per session, and absent on deep links", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "イントロをスキップ" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "イントロをスキップ" }).click();
  await expect(page.getByTestId("particle-opening")).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(700);
  await expect(page.getByTestId("particle-opening")).toHaveCount(0);
  await page.goto("/style/long-wolf");
  await expect(page.getByTestId("particle-opening")).toHaveCount(0);
});
test("context loss falls back without losing selection and SALON pauses rendering", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Desktop lens context; mobile uses DOM slider",
  );
  await page.goto("/color?style=long-wolf&color=black");
  await page.getByRole("button", { name: "SILVER", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page
    .getByRole("button", { name: /SALON \/ ACCESS/ })
    .first()
    .click();
  await expect(page.locator("[data-rendering]")).toHaveAttribute(
    "data-rendering",
    "paused",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-rendering]")).toHaveAttribute(
    "data-rendering",
    "active",
  );
  await page.locator("canvas").evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.getByRole("slider")).toBeVisible();
  expect((await selection(page)).selectedColor).toBe("black");
  await page.getByRole("button", { name: "APPLY SILVER", exact: true }).click();
  await page.getByRole("button", { name: "BOOK THIS LOOK" }).click();
  await expect(page.getByTestId("plan-summary")).toContainText("SILVER");
});
test("repeated angle and candidate changes keep GPU textures bounded", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Mobile comparison uses DOM images",
  );
  await page.goto("/color?style=long-wolf&color=black");
  await page.getByRole("button", { name: "SILVER", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  for (let i = 1; i <= 8; i++) {
    await page.getByRole("button", { name: `角度 ${i}`, exact: true }).click();
    await page
      .getByRole("button", { name: i % 2 ? "PINK" : "SILVER", exact: true })
      .click();
  }
  expect((await selection(page)).selectedColor).toBe("black");
  expect((await selection(page)).selectedAngle).toBe(7);
  await expect(
    page.getByRole("button", { name: "SILVER", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () =>
      Number(await page.locator("canvas").getAttribute("data-textures")),
    )
    .toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(1200);
  expect(
    Number(await page.locator("canvas").getAttribute("data-textures")),
  ).toBeLessThanOrEqual(4);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("[data-rendering]")).toHaveAttribute(
    "data-rendering",
    "paused",
  );
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("[data-rendering]")).toHaveAttribute(
    "data-rendering",
    "active",
  );
  await page.getByRole("button", { name: "BOOK THIS LOOK" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("portrait particles form before the photo, and the opening can replay", async ({ page }, info) => {
  await page.goto("/");
  const hero = page.locator("[data-intro]");
  const photo = page.locator("[data-hero-photo]");
  await expect(hero).toHaveAttribute("data-intro", "forming");
  expect(await photo.evaluate(e => Number(getComputedStyle(e).opacity))).toBeLessThan(.2);
  // Observe each animation frame; coarse assertion polling can miss this 500ms phase.
  await page.waitForFunction(() => document.querySelector("[data-intro]")?.getAttribute("data-intro") === "portrait");
  const canvas = page.getByTestId("particle-opening").locator("canvas");
  const count = Number(await canvas.getAttribute("data-particles"));
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(info.project.name === "desktop" ? 6000 : 700);
  await expect(hero).toHaveAttribute("data-intro", "rest");
  await expect(photo).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("particle-opening")).toHaveCount(0);
  await page.getByRole("button", { name: "人物形成の演出を再生" }).click();
  await expect(hero).toHaveAttribute("data-intro", "forming");
  await page.getByRole("button", { name: "イントロをスキップ" }).click();
  await expect(hero).toHaveAttribute("data-intro", "rest");
  await expect(photo).toHaveCSS("opacity", "1");
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 390, height: 664 });
    const mobileNavBox = await page.getByRole("navigation", { name: "モバイルナビゲーション" }).boundingBox();
    const replay = page.getByRole("button", { name: "人物形成の演出を再生" });
    const replayBox = await replay.boundingBox();
    expect(replayBox!.y + replayBox!.height).toBeLessThanOrEqual(mobileNavBox!.y - 8);
    await replay.click();
    const skip = page.getByRole("button", { name: "イントロをスキップ" });
    const skipBox = await skip.boundingBox();
    expect(skipBox!.y + skipBox!.height).toBeLessThanOrEqual(mobileNavBox!.y - 8);
    await skip.click();
  }
});

test("missing portrait data reveals the photo and keeps the booking entry available", async ({ page }) => {
  await page.route("**/data/hero-particles.json", route => route.abort());
  await page.goto("/");
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-intro", "rest");
  await expect(page.locator("[data-hero-photo]")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("particle-opening")).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem("noir-opening-portrait-v4"))).toBeNull();
  await page.getByRole("button", { name: "EXPLORE YOUR STYLE" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-mode", "style");
});

test("context loss during formation restores the photograph", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-intro", "forming");
  await page.getByTestId("particle-opening").locator("canvas").evaluate(canvas => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-intro", "rest");
  await expect(page.locator("[data-hero-photo]")).toHaveCSS("opacity", "1");
});
