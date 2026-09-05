import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("ERROR", msg.text());
});
await page.goto("http://localhost:3001/color?style=long-wolf&color=black");
await page.getByRole("button", { name: "SILVER", exact: true }).click();
await page.waitForTimeout(2500);
console.log(
  "WEBGL",
  await page.locator("[data-webgl]").evaluateAll((nodes) =>
    nodes.map((n) => ({
      state: n.dataset.webgl,
      tier: n.dataset.quality,
      canvas: !!n.querySelector("canvas"),
    })),
  ),
);
await page.screenshot({ path: "test-results/phase3-lens.png", fullPage: true });
await page.getByRole("button", { name: "APPLY SILVER", exact: true }).click();
await page.waitForTimeout(1200);
await page.goto("http://localhost:3001/");
await page.waitForTimeout(1700);
console.log("OPENING", await page.getByTestId("particle-opening").count());
await page.screenshot({
  path: "test-results/phase3-opening.png",
  fullPage: true,
});
await page.waitForTimeout(3500);
await page.screenshot({ path: "test-results/phase3-hero.png", fullPage: true });
await browser.close();
