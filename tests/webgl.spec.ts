import { test, expect, type Page } from "@playwright/test";
const selection = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("noir-selection-v2")!).state,
  );
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
  if (info.project.name !== "desktop") {
    const slider = page.getByRole("slider", {
      name: "BEFORE / AFTER カラー比較",
    });
    await expect(slider).toBeVisible();
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveValue("51");
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
  expect(errors).toEqual([]);
});
test("WebGL unavailable and reduced motion preserve the complete DOM flow", async ({
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
  await page.emulateMedia({ reducedMotion: "reduce" });
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
test("opening is skippable, once per session, and absent on deep links", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "SKIP INTRO ↗" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "SKIP INTRO ↗" }).click();
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
});
