import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE", msg.text());
});
page.on("requestfailed", (req) =>
  console.log("FAILED", req.url(), req.failure()?.errorText),
);
await page.goto("http://localhost:3000/color");
await page.waitForTimeout(4000);
console.log("MODE", await page.locator("main").getAttribute("data-mode"));
await page.screenshot({
  path: "test-results/inspect-color.png",
  fullPage: true,
});
await page.goto("http://localhost:3000/");
await page.waitForTimeout(1000);
await page.screenshot({
  path: "test-results/inspect-hero.png",
  fullPage: true,
});
await browser.close();
