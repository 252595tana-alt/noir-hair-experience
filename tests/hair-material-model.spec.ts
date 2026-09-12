import { test, expect } from "@playwright/test";
import { materialStyles, materialColors, materialTextures, materialBookingPath, parseMaterialSelection, materialBookingMessage } from "../src/components/HairMaterialLab/model";
import { createLineBookingUrl, createMaterialWebBookingUrl } from "../src/lib/bookingUrl";

test("all 24 material combinations round-trip through booking, WEB and LINE", () => {
  for (const style of materialStyles) for (const color of materialColors) for (const texture of materialTextures) {
    const selection = { style, color, texture };
    const path = new URL(materialBookingPath(selection), "https://example.com");
    expect(parseMaterialSelection(path.searchParams)).toEqual(selection);
    const web = new URL(createMaterialWebBookingUrl("https://example.com/book?salon=42#form", selection)!);
    expect(web.searchParams.get("salon")).toBe("42");
    expect(web.hash).toBe("#form");
    expect(parseMaterialSelection(web.searchParams)).toEqual(selection);
    const message = materialBookingMessage(selection);
    const line = new URL(createLineBookingUrl("https://line.me/R/oaMessage/@test/", message)!);
    expect(decodeURIComponent(line.search.slice(1))).toBe(message);
    for (const [key, value] of Object.entries(selection)) expect(message).toContain(`${key.toUpperCase()}: ${value.toUpperCase()}`);
  }
});

test("incomplete and untrusted booking values do not become selections", () => {
  for (const query of ["", "style=wave&color=ash&texture=silky", "source=hair-material-lab&style=wave&color=ash", "source=hair-material-lab&style=unknown&color=ash&texture=silky", "source=hair-material-lab&style=wave&color=ash&texture=<script>"]) {
    expect(parseMaterialSelection(new URLSearchParams(query))).toBeNull();
  }
  expect(createMaterialWebBookingUrl("javascript:alert(1)", { style: "wave", color: "ash", texture: "silky" })).toBeUndefined();
});
