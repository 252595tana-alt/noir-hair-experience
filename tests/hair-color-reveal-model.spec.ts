import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { parseRevealSelection, revealBookingMessage, revealBookingPath, validateRevealSelection } from "../src/components/HairColorParticleReveal/model";
import { createLineBookingUrl, createRevealWebBookingUrl } from "../src/lib/bookingUrl";

test("selection validation, reservation URL and LINE encoding preserve exact color", () => {
  const selection = { style: "silk-straight", color: "silver" } as const;
  expect(parseRevealSelection(new URL(revealBookingPath(selection), "https://salon.test").searchParams)).toEqual(selection);
  for (const invalid of [null, {}, { style: "__proto__", color: "black" }, { style: "silk-straight", color: "red" }]) expect(validateRevealSelection(invalid)).toBeNull();
  expect(parseRevealSelection(new URLSearchParams("source=depth-hair-portrait&style=silk-straight&color=silver"))).toBeNull();
  const external = new URL(createRevealWebBookingUrl("https://booking.test/?salon=noir", selection)!);
  expect(external.searchParams.get("salon")).toBe("noir");
  expect(external.searchParams.get("style")).toBe("silk-straight");
  expect(external.searchParams.get("color")).toBe("silver");
  const message = revealBookingMessage(selection);
  expect(decodeURIComponent(createLineBookingUrl("https://line.me/R/oaMessage/@salon/", message)!.split("?")[1])).toBe(message);
  expect(createRevealWebBookingUrl("javascript:alert(1)", selection)).toBeUndefined();
});

test("every offline emission seed belongs to the hair matte, with registered downward flow", async () => {
  const { data: mask, info } = await sharp("public/images/depth-portrait/hair-mask.png").greyscale().raw().toBuffer({ resolveWithObject: true });
  const file = await readFile("public/images/color-reveal/seeds.bin");
  expect(file.byteLength).toBe(12000 * 16);
  let invalidSeeds = 0;
  for (let offset = 0; offset < file.byteLength; offset += 16) {
    const u = file.readFloatLE(offset), v = file.readFloatLE(offset + 4);
    const x = Math.floor(u * info.width), y = Math.floor((1 - v) * info.height);
    if (!(mask[y * info.width + x] >= 220)) invalidSeeds++;
  }
  expect(invalidSeeds).toBe(0);
  const mobile = await readFile("public/images/color-reveal/seeds-mobile.bin");
  expect(mobile.equals(file.subarray(0, 2400 * 16))).toBe(true);
  const flow = await sharp("public/images/color-reveal/flow.png").raw().toBuffer();
  let upward = 0;
  for (let i = 1; i < flow.length; i += 3) if (flow[i] >= 128) upward++;
  expect(upward).toBe(0);
});
