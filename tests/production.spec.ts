import { test, expect } from "@playwright/test";
import { ResourceCache } from "../src/lib/resourceCache";
import { createLineBookingUrl } from "../src/lib/bookingUrl";
import { configureAnalytics, track } from "../src/lib/analytics";
import { safeJsonLd } from "../src/lib/seo";
import { safeHttps } from "../src/config/site";
test("bounded cache preserves pins, reuses recent resources and disposes stale loads", async () => {
  const disposed: string[] = [];
  let loads = 0;
  const cache = new ResourceCache(
    2,
    async (key: string) => {
      loads++;
      return key;
    },
    (value) => disposed.push(value),
  );
  await cache.acquire("a");
  cache.release("a");
  await cache.acquire("b");
  cache.release("b");
  await cache.acquire("a");
  expect(loads).toBe(2);
  await cache.acquire("c");
  expect(disposed).toContain("b");
  expect(cache.size).toBe(2);
  cache.release("a");
  cache.release("c");
  cache.clear();
  expect(disposed.sort()).toEqual(["a", "b", "c"]);
  let finish!: (value: string) => void;
  const pending = new ResourceCache(
    1,
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
    (value) => disposed.push(value),
  );
  const load = pending.acquire("pending");
  pending.clear();
  finish("late");
  await load;
  expect(disposed).toContain("late");
});
test("LINE encodes Japanese, rejects unsafe URLs and analytics cannot break booking", () => {
  const message = "WOLFのスタイルで、\nSILVER / CUT & COLOR";
  const url = createLineBookingUrl(
    "https://line.me/R/oaMessage/@salon/",
    message,
  )!;
  expect(decodeURIComponent(url.split("?")[1])).toBe(message);
  expect(createLineBookingUrl("javascript:alert(1)", message)).toBeUndefined();
  expect(createLineBookingUrl(undefined, message)).toBeUndefined();
  const events: string[] = [];
  const unsubscribe = configureAnalytics((event) => events.push(event));
  track("color_apply");
  track("booking_open");
  track("booking_line_click", { configured: true });
  unsubscribe();
  expect(events).toEqual(["color_apply", "booking_open", "booking_line_click"]);
  configureAnalytics(() => {
    throw Error("analytics unavailable");
  });
  expect(() => track("booking_open")).not.toThrow();
  configureAnalytics(() => {});
  expect(safeJsonLd({ name: "</script><script>" })).not.toContain("<");
});
test("configured booking endpoints preserve account encoding and require HTTPS",()=>{
  const line = safeHttps("https://line.me/R/oaMessage/@demo/");
  expect(createLineBookingUrl(line,"スタイルについて相談希望です。"))
    .toBe("https://line.me/R/oaMessage/%40demo/?"+encodeURIComponent("スタイルについて相談希望です。"));
  expect(safeHttps("https://booking.example/reserve")).toBe("https://booking.example/reserve");
  expect(safeHttps("http://booking.example/reserve")).toBeUndefined();
  expect(safeHttps("https://user:password@booking.example/reserve")).toBeUndefined();
});
test("no-JS pages expose style, menu and salon information",async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  try {
    await page.goto((process.env.TEST_BASE_URL??"http://127.0.0.1:3000")+"/style/long-wolf");
    await expect(page.getByRole("heading",{name:"WOLF ヘアスタイル"})).toBeVisible();
    await expect(page.getByText("STYLIST / TAKUYA")).toBeVisible();
    await page.getByRole("link",{name:"MENU",exact:true}).click();await expect(page.getByText("TREATMENT",{exact:true})).toBeVisible();
    await page.getByRole("link",{name:"SALON",exact:true}).click();await expect(page.getByText("ADDRESS",{exact:true})).toBeVisible();
  }finally{await context.close();}
});
test("slow image loading keeps a placeholder and booking remains available",async({page})=>{
  await page.route("**/hair/black/*",async route=>{await new Promise(resolve=>setTimeout(resolve,2000));await route.continue().catch(()=>{});});
  await page.goto("/color?style=long-wolf&color=black");
  await expect(page.getByTestId("hair-viewer").locator("picture")).toHaveAttribute("data-loaded","false");
  await page.getByRole("button",{name:"BOOK THIS LOOK"}).click();await expect(page.getByTestId("plan-summary")).toContainText("BLACK");
});
test("individual metadata and useful content are server rendered", async ({
  request,
}) => {
  for (const path of [
    "/",
    "/style",
    "/style/long-wolf",
    "/stylist/takuya",
    "/menu",
    "/salon",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain("application/ld+json");
    if (path === "/style/long-wolf") {
      expect(html).toContain("WOLF ヘアスタイル");
      expect(html).toContain("TAKUYA");
      expect(html).toContain("ESTIMATE");
    }
    if (path === "/menu") expect(html).toContain("TREATMENT");
  }
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /",
  );
  expect((await request.get("/style/missing-style")).status()).toBe(404);
});
test("responsive widths, reduced data, image formats, and idle WebGL", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "connection", {
      value: {
        saveData: true,
        addEventListener() {},
        removeEventListener() {},
      },
    }),
  );
  await page.goto("/");
  await page.waitForTimeout(600);
  await expect(page.locator("canvas")).toHaveCount(0);
  for (const width of [390, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/style/long-wolf", "/color", "/booking", "/salon"]) {
      await page.goto(path);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
  }
  await page.goto("/color?style=long-wolf&color=black");
  await expect(
    page.locator('picture source[type="image/avif"]').first(),
  ).toBeAttached();
  expect(
    await page
      .getByTestId("hair-viewer")
      .locator("img")
      .evaluate((image) => (image as HTMLImageElement).currentSrc),
  ).toMatch(/\.(avif|webp|jpg)$/);
});
