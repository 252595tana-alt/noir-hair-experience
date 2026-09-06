import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const results = [];
for (const profile of [
  { name: "Chrome desktop", engine: chromium, channel: "chrome", width: 1440 },
  { name: "Edge desktop", engine: chromium, channel: "msedge", width: 1440 },
  { name: "WebKit desktop", engine: webkit, width: 1440 },
  { name: "iPhone WebKit emulation", engine: webkit, width: 390, mobile: true },
  {
    name: "Android Chrome emulation",
    engine: chromium,
    channel: "chrome",
    width: 430,
    mobile: true,
  },
]) {
  const browser = await profile.engine.launch({
    headless: true,
    ...(profile.channel ? { channel: profile.channel } : {}),
  });
  const context = await browser.newContext({
    viewport: { width: profile.width, height: 900 },
    isMobile: !!profile.mobile,
    hasTouch: !!profile.mobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/color?style=long-wolf&color=black");
  await page.getByRole("button", { name: "角度 5", exact: true }).click();
  await page.getByRole("button", { name: "SILVER", exact: true }).click();
  if (profile.mobile) {
    await expect(page.getByRole("slider")).toBeVisible();
    await page.getByRole("slider").fill("65");
  }
  await page.getByRole("button", { name: "APPLY SILVER", exact: true }).click();
  await expect(page.getByTestId("angle-index")).toHaveText("05");
  await page.getByRole("button", { name: "BOOK THIS LOOK" }).click();
  await expect(page.getByTestId("plan-summary")).toContainText("SILVER");
  await page.getByRole("button", { name: "LINEで予約" }).click();
  await expect(
    page.getByRole("textbox", { name: "生成した予約文" }),
  ).toHaveValue(/SILVER/);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: /SALON \/ ACCESS/ })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "07 / SALON & ACCESS" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.goBack();
  await expect(page.locator("main")).toHaveAttribute("data-mode", "color");
  await page.goto(base + "/");
  await page.waitForTimeout(4500);
  const unwoven = page.getByTestId("hair-unwoven-gallery");
  await unwoven.scrollIntoViewIfNeeded();
  if (profile.mobile) {
    await unwoven.getByRole("button", { name: "NEXT STYLE" }).click();
  } else {
    const stage = unwoven.getByTestId("hair-unwoven-stage");
    const bounds = await stage.boundingBox();
    if (!bounds) throw new Error("Hair Unwoven stage is not visible");
    const x = bounds.x + bounds.width * 0.68;
    const y = bounds.y + bounds.height * 0.5;
    await page.mouse.move(x, y);
    await page.mouse.wheel(72, 0);
  }
  await expect(unwoven).toHaveAttribute("data-current-style", "wave");
  if (!profile.mobile) {
    const stage = unwoven.getByTestId("hair-unwoven-stage");
    const bounds = await stage.boundingBox();
    if (!bounds) throw new Error("Hair Unwoven stage is not visible");
    const x = bounds.x + bounds.width * 0.68;
    const y = bounds.y + bounds.height * 0.5;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 120, y + 3, { steps: 8 });
    await page.mouse.up();
    await expect(unwoven).toHaveAttribute("data-current-style", "bob");
    await unwoven.getByRole("button", { name: "PREVIOUS STYLE" }).click();
    await expect(unwoven).toHaveAttribute("data-current-style", "wave");
  }
  await unwoven
    .getByRole("button", { name: "BOOK THIS STYLE — WAVE" })
    .click();
  await expect(page.getByTestId("plan-summary")).toContainText("WAVE");
  const violations = [];
  for (const path of [
    "/",
    "/style/long-wolf",
    "/color",
    "/stylist/takuya",
    "/menu",
    "/booking",
    "/salon",
  ]) {
    await page.goto(base + path);
    await page.waitForTimeout(path === "/" ? 4500 : 800);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    violations.push(
      ...audit.violations.map((v) => ({
        path,
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    );
  }
  results.push({ browser: profile.name, errors, violations });
  console.log(
    profile.name,
    errors.length,
    "page errors",
    violations.length,
    "a11y violations",
  );
  await browser.close();
}
await mkdir("docs/audit", { recursive: true });
await writeFile("docs/audit/browser-qa.json", JSON.stringify(results, null, 2));
if (results.some((r) => r.errors.length || r.violations.length))
  process.exitCode = 1;
