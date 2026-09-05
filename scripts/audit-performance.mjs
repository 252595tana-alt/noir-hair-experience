import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
for (const mobile of [false, true]) {
  const page = await browser.newPage({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 1000 },
    isMobile: mobile,
    hasTouch: mobile,
  });
  await page.addInitScript(() => {
    window.audit = { lcp: 0, cls: 0, interaction: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.audit.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (!e.hadRecentInput) window.audit.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (e.interactionId)
          window.audit.interaction = Math.max(
            window.audit.interaction,
            e.duration,
          );
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 40,
    downloadThroughput: 1250000,
    uploadThroughput: 625000,
  });
  if (mobile) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto(process.env.AUDIT_URL ?? "http://localhost:3001/");
  await page.waitForTimeout(5500);
  const metrics = await page.evaluate(() => ({
    ...window.audit,
    resources: performance
      .getEntriesByType("resource")
      .map((r) => ({
        name: r.name,
        type: r.initiatorType,
        bytes: r.encodedBodySize,
        transfer: r.transferSize,
      })),
  }));
  await page.getByRole("button", { name: /EXPLORE YOUR STYLE/ }).click();
  await page.waitForTimeout(1000);
  metrics.interaction = await page.evaluate(() => window.audit.interaction);
  results.push({
    device: mobile ? "390px / CPU4x" : "1440px",
    ...metrics,
    jsBytes: metrics.resources
      .filter((r) => r.name.includes(".js"))
      .reduce((s, r) => s + r.bytes, 0),
  });
  await page.close();
}
await browser.close();
await mkdir("docs/audit", { recursive: true });
const output = "docs/audit/" + (process.argv[2] ?? "after") + ".json";
await writeFile(output, JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    results.map((r) => ({
      device: r.device,
      lcp: r.lcp,
      cls: r.cls,
      interaction: r.interaction,
      jsBytes: r.jsBytes,
    })),
    null,
    2,
  ),
);
