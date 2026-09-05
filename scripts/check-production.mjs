import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
await fs.mkdir("docs/screenshots", { recursive: true });
const desktop = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
});
await desktop.goto("http://localhost:3001/");
await desktop.waitForTimeout(4500);
await expect(desktop.getByTestId("particle-opening")).toHaveCount(0);
await expect
  .poll(() =>
    desktop.locator("main").evaluate((el) => getComputedStyle(el).opacity),
  )
  .toBe("1");
await desktop.screenshot({
  path: "docs/screenshots/desktop-home.png",
  fullPage: true,
});
const mobile = await browser.newPage({
  viewport: { width: 375, height: 812 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
});
await mobile.goto("http://localhost:3001/");
await mobile.waitForTimeout(4500);
await expect(mobile.getByTestId("particle-opening")).toHaveCount(0);
await expect
  .poll(() =>
    mobile.locator("main").evaluate((el) => getComputedStyle(el).opacity),
  )
  .toBe("1");
await mobile.screenshot({
  path: "docs/screenshots/mobile-home.png",
  fullPage: true,
});
await mobile.goto("http://localhost:3001/color");
await expect(mobile.locator("main")).toHaveAttribute("data-mode", "color");
await expect
  .poll(() =>
    mobile.locator("main").evaluate((el) => getComputedStyle(el).opacity),
  )
  .toBe("1");
const viewer = mobile.getByTestId("hair-viewer");
const box = await viewer.boundingBox();
const client = await mobile.context().newCDPSession(mobile);
const x = box.x + box.width / 2,
  y = box.y + box.height * 0.7;
await client.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x, y }],
});
for (let i = 1; i <= 8; i++)
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x, y: y - i * 20 }],
  });
await client.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
await expect
  .poll(() => mobile.evaluate(() => window.scrollY))
  .toBeGreaterThan(30);
await expect(mobile.getByTestId("angle-index")).toHaveText("01");
console.log(
  "PASS: vertical touch scroll remains native and does not rotate hair.",
);
await mobile.setViewportSize({ width: 320, height: 700 });
for (const route of [
  "/",
  "/style",
  "/color",
  "/stylist",
  "/menu",
  "/booking",
  "/salon",
]) {
  await mobile.goto("http://localhost:3001" + route);
  await expect
    .poll(() =>
      mobile.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}
console.log("PASS: production routes fit 320px width.");
await mobile.route("**/hair/black/*", (route) => route.abort());
await mobile.goto("http://localhost:3001/color");
await expect(viewer.locator("img")).toHaveAttribute(
  "src",
  /\/images\/placeholder\.svg$/,
);
console.log("PASS: unavailable frame falls back to the shared placeholder.");
await browser.close();
