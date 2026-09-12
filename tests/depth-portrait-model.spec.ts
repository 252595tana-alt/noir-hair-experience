import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { depthPortraits, portraitColors, portraitBookingPath, parsePortraitSelection, portraitBookingMessage, validatePortraitSelection } from "../src/components/DepthHairPortrait/model";
import { createLineBookingUrl, createPortraitWebBookingUrl } from "../src/lib/bookingUrl";

test("every portrait color preserves style and color in booking and LINE", () => {
  for (const color of portraitColors) {
    const selection = { style: "silk-straight" as const, color };
    const url = new URL(portraitBookingPath(selection), "https://example.com");
    expect(parsePortraitSelection(url.searchParams)).toEqual(selection);
    const message = portraitBookingMessage(selection);
    expect(message).toContain("STYLE: SILK STRAIGHT");
    expect(message).toContain(`COLOR: ${color.toUpperCase()}`);
    const line = new URL(createLineBookingUrl("https://line.me/R/oaMessage/@test/", message)!);
    expect(decodeURIComponent(line.search.slice(1))).toBe(message);
    const web = new URL(createPortraitWebBookingUrl("https://example.com/book?salon=123#form", selection)!);
    expect(parsePortraitSelection(web.searchParams)).toEqual(selection);
    expect(web.searchParams.get("salon")).toBe("123");
    expect(web.hash).toBe("#form");
  }
  for (const value of [null, {}, { style: "__proto__", color: "ash" }, { style: "silk-straight", color: "red" }]) expect(validatePortraitSelection(value)).toBeNull();
  expect(parsePortraitSelection(new URLSearchParams("style=silk-straight&color=ash"))).toBeNull();
});

test("maps are registered to the photo, isolate skin and encode four distinct depth regions", async () => {
  const asset = depthPortraits["silk-straight"];
  const photo = await sharp("public" + asset.photo).metadata();
  const mask = await sharp("public" + asset.mask).greyscale().raw().toBuffer({ resolveWithObject: true });
  const depth = await sharp("public" + asset.depth).greyscale().raw().toBuffer({ resolveWithObject: true });
  expect([mask.info.width, mask.info.height]).toEqual([photo.width, photo.height]);
  expect([depth.info.width, depth.info.height]).toEqual([photo.width, photo.height]);
  const sample = (buffer: Buffer, x: number, y: number) => buffer[y * mask.info.width + x] / 255;
  for (const [x, y] of [[510, 650], [445, 580], [510, 1200], [140, 1000], [75, 200]]) expect(sample(mask.data, x, y)).toBeLessThan(.015);
  for (const [x, y] of [[330, 430], [720, 700], [710, 1150]]) expect(sample(mask.data, x, y)).toBeGreaterThan(.8);
  const background = sample(depth.data, 70, 200), face = sample(depth.data, 510, 650);
  const fringe = sample(depth.data, 335, 410), tips = sample(depth.data, 720, 1220);
  expect(background).toBeLessThan(.12);
  expect(tips).toBeGreaterThan(background + .18);
  expect(face).toBeGreaterThan(tips + .15);
  expect(fringe).toBeGreaterThan(face + .07);
  const mobile = await sharp("public" + asset.mobileDepth).metadata();
  expect(mobile.width).toBeLessThan(400);
  expect(mobile.width! / mobile.height!).toBeCloseTo(photo.width! / photo.height!);
});
