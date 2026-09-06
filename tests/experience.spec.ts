import { test, expect, type Page } from "@playwright/test";
async function nav(
  page: Page,
  mode: "style" | "color" | "stylist" | "menu" | "booking",
) {
  const mobile = await page
    .getByRole("navigation", { name: "モバイルナビゲーション" })
    .isVisible();
  const navigation = page.getByRole("navigation", {
    name: mobile ? "モバイルナビゲーション" : "メインナビゲーション",
  });
  if (mobile && (mode === "stylist" || mode === "menu")) {
    await navigation.getByRole("button", { name: /MENU/ }).click();
    await page
      .getByRole("dialog", { name: "EXPLORE" })
      .getByRole("button", {
        name: mode === "menu" ? /MENU \/ PRICE/ : /STYLIST/,
      })
      .click();
  } else
    await navigation
      .getByRole("button", {
        name: new RegExp(mode === "booking" ? "BOOK" : mode.toUpperCase()),
      })
      .click();
  await expect(page.locator("main")).toHaveAttribute("data-mode", mode);
}
async function saved(page: Page) {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem("noir-selection-v2") ?? "{}").state,
  );
}
async function shot(page: Page, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect
    .poll(() =>
      page.locator("main").evaluate((el) => getComputedStyle(el).opacity),
    )
    .toBe("1");
  await page.screenshot({
    path: "test-results/" + name + ".png",
    fullPage: true,
  });
}
async function swipe(page: Page, selector: string, dx: number, dy = 0) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  const box = (await page.locator(selector).boundingBox())!;
  const x = box.x + box.width * 0.65,
    y = box.y + box.height * 0.5;
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 8; i++)
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + (dx * i) / 8, y: y + (dy * i) / 8 }],
    });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await session.detach();
}

test("complete selection journey, CHANGE, salon, persistence and confirmed RESET", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/style/long-wolf");
  await expect(
    page.getByRole("heading", { name: "WOLF", exact: true }),
  ).toBeVisible();
  expect((await saved(page)).selectedStyleId).toBe("long-wolf");
  expect((await saved(page)).selectedColor).toBe("ash");
  await page.getByRole("button", { name: "360° VIEW" }).click();
  await page.getByRole("button", { name: "角度 5", exact: true }).click();
  await page.getByRole("button", { name: "TRY COLOR" }).click();
  await page.getByRole("button", { name: "SILVER", exact: true }).click();
  await page.getByRole("button", { name: "APPLY SILVER", exact: true }).click();
  await expect(page.getByTestId("angle-index")).toHaveText("05");
  await page.getByRole("button", { name: "VIEW STYLIST" }).click();
  await expect(page).toHaveURL(/\/stylist\/takuya$/);
  await expect(
    page.getByRole("heading", { name: "TAKUYA’S WORKS" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "BOBのスタイルを選択" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "WOLFのスタイルを選択" }).click();
  await expect(page.getByTestId("angle-index")).toHaveText("05");
  await nav(page, "menu");
  await expect(page.getByTestId("estimated-price")).toHaveText("¥30,400〜");
  await expect(page.getByTestId("estimated-time")).toHaveText("270–300 MIN");
  await page
    .getByRole("button", { name: "OPTION TREATMENT", exact: true })
    .click();
  await expect(page.getByTestId("estimated-price")).toHaveText("¥34,800〜");
  await expect(page.getByTestId("estimated-time")).toHaveText("300–330 MIN");
  await page.getByRole("button", { name: "CONTINUE TO BOOK" }).click();
  const plan = page.getByTestId("plan-summary");
  for (const text of [
    "WOLF",
    "SILVER",
    "TAKUYA",
    "CUT + COLOR + BLEACH + TREATMENT",
  ])
    await expect(plan).toContainText(text);
  await expect(page.getByTestId("booking-image")).toHaveAttribute(
    "src",
    /\/hair\/silver\/05-768\.jpg$/,
  );
  await shot(page, info.project.name + "-phase2-booking");
  await page.getByRole("button", { name: "LINEで予約" }).click();
  await expect(
    page.getByRole("textbox", { name: "生成した予約文" }),
  ).toHaveValue(/WOLFのスタイルで、[\s\S]*SILVER[\s\S]*TAKUYA[\s\S]*TREATMENT/);
  await page
    .getByRole("button", { name: "LINE MESSAGE PREVIEWを閉じる" })
    .click();
  await page.getByRole("button", { name: "CHANGE COLOR", exact: true }).click();
  await page.getByRole("button", { name: "BLACK", exact: true }).click();
  await page.getByRole("button", { name: "APPLY BLACK", exact: true }).click();
  await nav(page, "booking");
  await expect(plan).toContainText("BLACK");
  await expect(plan).not.toContainText("BLEACH");
  await expect(page.getByTestId("estimated-price")).toHaveText("¥19,800〜");
  const before = await saved(page);
  await page
    .getByRole("button", { name: /SALON \/ ACCESS/ })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "07 / SALON & ACCESS" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("main")).toHaveAttribute("data-mode", "booking");
  expect(await saved(page)).toEqual(before);
  await page.getByRole("button", { name: "NŌIR ホーム" }).click();
  expect(await saved(page)).toEqual(before);
  await nav(page, "booking");
  await page.reload();
  await expect(plan).toContainText("TREATMENT");
  expect(await saved(page)).toEqual(before);
  await page
    .getByRole("button", { name: "RESET SELECTION", exact: true })
    .click();
  await page.getByRole("button", { name: "キャンセル", exact: true }).click();
  expect(await saved(page)).toEqual(before);
  await page
    .getByRole("button", { name: "RESET SELECTION", exact: true })
    .click();
  await page.getByRole("button", { name: "リセットする", exact: true }).click();
  await expect(page.getByTestId("estimated-price")).toHaveText("要相談");
  const reset = await saved(page);
  expect(reset).toMatchObject({
    selectedStyleId: null,
    selectedColor: "black",
    selectedAngle: 0,
    selectedStylistId: null,
    optionalMenus: [],
  });
  await page.reload();
  await expect(page.getByTestId("estimated-price")).toHaveText("要相談");
  expect(errors).toEqual([]);
});

test("stylist works, incompatible color fallback, nomination fee and keyboard options", async ({
  page,
}, info) => {
  await page.goto("/color?style=long-wolf&color=silver");
  await expect(
    page.getByRole("button", { name: "SILVER", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "角度 5", exact: true }).click();
  await nav(page, "stylist");
  await page.getByRole("button", { name: "YUKIの作品を見る" }).click();
  await expect(
    page.getByRole("heading", { name: "YUKI’S WORKS" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "LONGのスタイルを選択" }),
  ).toHaveCount(0);
  await shot(page, info.project.name + "-phase2-stylist");
  await page.getByRole("button", { name: "BOBのスタイルを選択" }).click();
  expect((await saved(page)).selectedColor).toBe("black");
  expect((await saved(page)).selectedAngle).toBe(4);
  await nav(page, "color");
  await expect(
    page.getByRole("button", { name: "SILVER", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "ASH GRAY", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "APPLY ASH GRAY", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "ASH GRAY", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await nav(page, "menu");
  await expect(page.getByTestId("estimated-price")).toHaveText("¥14,850〜");
  await page
    .getByRole("button", { name: "OPTION HEAD SPA", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("estimated-price")).toHaveText("¥18,150〜");
  await expect(page.getByTestId("estimated-time")).toHaveText("180–210 MIN");
  await nav(page, "booking");
  await page
    .getByRole("button", { name: "CHANGE STYLIST", exact: true })
    .click();
  await page.getByRole("button", { name: "BOOK REN", exact: true }).click();
  await expect(page.getByTestId("estimated-price")).toHaveText("¥17,600〜");
  await expect(page.getByTestId("plan-summary")).toContainText("REN");
  await page.getByRole("button", { name: "CHANGE MENU", exact: true }).click();
  await page
    .getByRole("button", { name: "OPTION HEAD SPA", exact: true })
    .click();
  await nav(page, "booking");
  await expect(page.getByTestId("estimated-price")).toHaveText("¥14,300〜");
});

test("Back and Forward preserve latest selection while changing modes", async ({
  page,
}) => {
  await page.goto("/style/long-wolf");
  await expect(
    page.getByRole("heading", { name: "WOLF", exact: true }),
  ).toBeVisible();
  await nav(page, "color");
  await page.getByRole("button", { name: "SILVER", exact: true }).click();
  await page.getByRole("button", { name: "APPLY SILVER", exact: true }).click();
  await page.getByRole("button", { name: "角度 5", exact: true }).click();
  await nav(page, "stylist");
  await page.goBack();
  await expect(page.locator("main")).toHaveAttribute("data-mode", "color");
  await expect(page.getByTestId("angle-index")).toHaveText("05");
  await page.goBack();
  await expect(page.locator("main")).toHaveAttribute("data-mode", "style");
  expect((await saved(page)).selectedColor).toBe("silver");
  await page.goForward();
  await expect(page.locator("main")).toHaveAttribute("data-mode", "color");
  await expect(
    page.getByRole("button", { name: "SILVER", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await nav(page, "stylist");
  await page.getByRole("button", { name: "YUKIの作品を見る" }).click();
  await page.getByRole("button", { name: "BOBのスタイルを選択" }).click();
  await page.goBack();
  await expect(page.locator("main")).toHaveAttribute("data-mode", "stylist");
  expect((await saved(page)).selectedStyleId).toBe("bob");
});

test("empty consultation, generated text and resetting optional-only plans", async ({
  page,
}) => {
  await page.goto("/booking");
  await expect(page.getByTestId("estimated-price")).toHaveText("要相談");
  await page.getByRole("button", { name: "LINEで予約" }).click();
  await expect(
    page.getByRole("textbox", { name: "生成した予約文" }),
  ).toHaveValue("スタイルについて相談希望です。");
  await page.keyboard.press("Escape");
  await nav(page, "menu");
  await page.getByRole("button", { name: "OPTION TREATMENT" }).click();
  await nav(page, "booking");
  await expect(page.getByTestId("estimated-price")).toHaveText("¥4,400〜");
  await page
    .getByRole("button", { name: "CONSULTATION / 相談して決める" })
    .click();
  await page.getByRole("button", { name: "LINEで予約" }).click();
  await expect(
    page.getByRole("textbox", { name: "生成した予約文" }),
  ).toHaveValue("スタイルについて相談希望です。");
});

test("TOP portrait rotates by drag, swipe and keyboard and carries its angle into STYLE", async ({
  page,
}, info) => {
  await page.goto("/");
  const hero = page.locator("[data-intro]");
  const skip = page.getByRole("button", { name: "イントロをスキップ" });
  const turntable = page.getByTestId("hero-turntable");
  const rotateButton = page.getByRole("button", { name: "人物を次の角度へ45度回転" });
  await expect(turntable).toHaveAttribute("aria-disabled", "true");
  await expect(rotateButton).toBeDisabled();
  await expect.poll(async () =>
    (await skip.isVisible()) || (await hero.getAttribute("data-intro")) === "rest",
  ).toBe(true);
  if (await skip.isVisible()) await skip.click();
  await expect(hero).toHaveAttribute("data-intro", "rest");
  await expect(turntable).toHaveAttribute("role", "slider");
  await expect(turntable).toHaveAttribute("aria-disabled", "false");
  await expect(rotateButton).toBeEnabled();
  await expect(turntable).toHaveAttribute("data-angle", "0");

  await turntable.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(turntable).toHaveAttribute("data-angle", "2");
  await expect(turntable).toHaveAttribute("data-rotating", "false");
  await expect(turntable).toHaveAttribute("data-visual-angle", "2");
  await page.keyboard.press("ArrowLeft");
  await expect(turntable).toHaveAttribute("data-angle", "1");
  await page.keyboard.press("Home");
  await expect(turntable).toHaveAttribute("data-angle", "0");
  await expect(turntable).toHaveAttribute("data-rotating", "false");
  await rotateButton.click();
  await rotateButton.click();
  await expect(turntable).toHaveAttribute("data-angle", "2");
  await expect(turntable).toHaveAttribute("data-rotating", "false");
  await expect(turntable).toHaveAttribute("data-visual-angle", "2");
  await turntable.focus();
  await page.keyboard.press("Home");
  await expect(turntable).toHaveAttribute("data-rotating", "false");

  if (info.project.name !== "desktop") {
    await swipe(page, '[data-testid="hero-turntable"]', 4, 90);
    await expect(turntable).toHaveAttribute("data-angle", "0");
    await swipe(page, '[data-testid="hero-turntable"]', -105);
  } else {
    const box = (await turntable.boundingBox())!;
    await page.mouse.move(box.x + box.width * .62, box.y + box.height * .48);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .62 - 105, box.y + box.height * .48, { steps: 10 });
    await page.mouse.up();
  }
  await expect.poll(async () => Number(await turntable.getAttribute("data-angle"))).not.toBe(0);
  const angle = Number(await turntable.getAttribute("data-angle"));
  expect((await saved(page)).selectedAngle).toBe(angle);

  await page.getByRole("button", { name: "人物形成の演出を再生" }).click();
  await expect(turntable).toHaveAttribute("aria-disabled", "true");
  await expect(turntable).toHaveAttribute("data-visual-angle", "0");
  await page.getByRole("button", { name: "イントロをスキップ" }).click();
  await expect(turntable).toHaveAttribute("data-rotating", "false");
  await expect(turntable).toHaveAttribute("data-visual-angle", String(angle));

  await page.getByRole("button", { name: "EXPLORE YOUR STYLE" }).click();
  await page.getByRole("button", { name: "360° VIEW" }).click();
  await expect(page.getByTestId("angle-index")).toHaveText(String(angle + 1).padStart(2, "0"));
});

test("Phase 1 hero, drag and swipe, all angles and color loading remain intact", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "BE YOU.",
  );
  await nav(page, "style");
  await page.getByRole("button", { name: "次のスタイル", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "WOLF", exact: true }),
  ).toBeVisible();
  if (info.project.name !== "desktop") {
    await swipe(
      page,
      '[aria-label="スタイルを左右スワイプまたは矢印キーで切替"]',
      -110,
    );
    await expect(
      page.getByRole("heading", { name: "PERM", exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "360° VIEW" }).click();
  const viewer = page.getByTestId("hair-viewer");
  await viewer.scrollIntoViewIfNeeded();
  if (info.project.name === "desktop") {
    const b = (await viewer.boundingBox())!;
    await page.mouse.move(b.x + b.width * 0.65, b.y + b.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * 0.65 - 100, b.y + b.height * 0.5, {
      steps: 8,
    });
    await page.mouse.up();
  } else await swipe(page, '[data-testid="hair-viewer"]', -100);
  await expect(page.getByTestId("angle-index")).toHaveText("03");
  await viewer.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("angle-index")).toHaveText("04");
  const sources = new Set<string>();
  for (let i = 1; i <= 8; i++) {
    await page.getByRole("button", { name: "角度 " + i, exact: true }).click();
    sources.add((await viewer.locator("img").getAttribute("src"))!);
  }
  expect(sources.size).toBe(8);
  await page.getByRole("button", { name: "ひとつ次の角度" }).click();
  await expect(page.getByTestId("angle-index")).toHaveText("01");
});

test("direct routes, reduced motion, invalid IDs, persisted corruption and image fallback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/stylist/ren");
  await expect(
    page.getByRole("heading", { name: "REN’S WORKS" }),
  ).toBeVisible();
  for (const route of [
    "/",
    "/style",
    "/color",
    "/stylist",
    "/menu",
    "/booking",
    "/concept",
    "/salon",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  for (const path of ["/style/missing", "/stylist/missing"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }
  await page.goto("/booking");
  await page.evaluate(() =>
    localStorage.setItem(
      "noir-selection-v2",
      JSON.stringify({
        version: 2,
        state: {
          selectedStyleId: "missing",
          selectedStylistId: "missing",
          selectedColor: "unknown",
          selectedAngle: -19,
          optionalMenus: ["bad"],
        },
      }),
    ),
  );
  await page.reload();
  await expect(page.getByTestId("estimated-price")).toHaveText("要相談");
  expect((await saved(page)).selectedStylistId).toBeNull();
  await page.route("**/hair/black/*", (route) => route.abort());
  await page.goto("/color?style=long&color=black");
  await expect(page.getByTestId("hair-viewer").locator("img")).toHaveAttribute(
    "src",
    /\/images\/placeholder\.svg$/,
  );
});

test("image requests stay bounded on initial color entry", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/hair/")) requests.push(r.url());
  });
  await page.goto("/color?style=long&color=black");
  await expect
    .poll(() =>
      page
        .getByTestId("hair-viewer")
        .locator("img")
        .evaluate((img) => (img as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  expect(new Set(requests).size).toBeLessThanOrEqual(5);
});

