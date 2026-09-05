import { test, expect } from "@playwright/test";
import { useSiteStore } from "../src/store/useSiteStore";
import { styles } from "../src/data/styles";
import { stylists } from "../src/data/stylists";
import { menus } from "../src/data/menu";
import { colorMenuRequirements } from "../src/data/colorMenus";
import { createBookingMessage } from "../src/lib/createBookingMessage";
test.beforeEach(() => useSiteStore.getState().resetSelection());
test("recommended services deduplicate and optional services survive dependency changes", () => {
  const state = useSiteStore.getState();
  state.setStyle("long-wolf");
  state.setAngle(4);
  state.setColor("silver");
  state.toggleMenu("treatment");
  let plan = useSiteStore.getState();
  expect(plan.selectedMenus).toEqual(["cut", "color", "bleach", "treatment"]);
  expect(plan.estimatedPrice).toBe(34800);
  expect(plan.estimatedTime).toEqual({ min: 300, max: 330 });
  state.setColor("black");
  plan = useSiteStore.getState();
  expect(plan.selectedMenus).toEqual(["cut", "color", "treatment"]);
  expect(plan.estimatedPrice).toBe(19800);
  expect(plan.selectedAngle).toBe(4);
  state.setColor("silver");
  state.toggleMenu("color");
  expect(useSiteStore.getState().selectedMenus).toContain("color");
});
test("style compatibility, manual nomination, invalid inputs and reset are safe", () => {
  const state = useSiteStore.getState();
  state.setStyle("long-wolf");
  state.setColor("silver");
  state.setAngle(4);
  state.setStyle("bob");
  expect(useSiteStore.getState().selectedColor).toBe("black");
  expect(useSiteStore.getState().selectedAngle).toBe(4);
  state.setStylist("ren");
  state.setStyle("bob");
  expect(useSiteStore.getState().selectedStylistId).toBe("ren");
  state.setStylist("does-not-exist");
  state.setStyle("bad");
  state.setAngle(NaN);
  expect(useSiteStore.getState().selectedStylistId).toBe("ren");
  state.resetSelection();
  expect(useSiteStore.getState()).toMatchObject({
    selectedStyleId: null,
    selectedColor: "black",
    selectedAngle: 0,
    selectedStylistId: null,
    selectedMenus: [],
    estimatedPrice: 0,
    estimatedTime: { min: 0, max: 0 },
  });
});
test("data relationships and booking message remain internally consistent", () => {
  const ids = menus.map((menu) => menu.id);
  for (const style of styles) {
    expect(style.availableColors).toContain(style.defaultColor);
    expect(
      stylists.find((person) => person.id === style.stylistId)?.styleIds,
    ).toContain(style.id);
    for (const id of style.recommendedMenus) expect(ids).toContain(id);
    for (const color of style.availableColors)
      expect(style.hairImages[color]).toHaveLength(8);
  }
  for (const required of Object.values(colorMenuRequirements))
    for (const id of required) expect(ids).toContain(id);
  const state = useSiteStore.getState();
  expect(createBookingMessage(state)).toBe("スタイルについて相談希望です。");
  state.setStyle("long-wolf");
  state.setColor("silver");
  expect(createBookingMessage(useSiteStore.getState())).toContain(
    "TAKUYAさんを指名希望です。",
  );
  state.setConsultation(true);
  expect(createBookingMessage(useSiteStore.getState())).toBe(
    "スタイルについて相談希望です。",
  );
});
import { sampleFps } from "../src/three/Performance/fps";
import { usePerformanceTier } from "../src/hooks/usePerformanceTier";

test("sustained FPS degradation reduces geometry before shaders and lens", () => {
  const sample = { elapsed: 0, frames: 0, slow: 0 };
  let drops = 0;
  for (let i = 0; i < 130; i++) if (sampleFps(sample, 0.05)) drops++;
  expect(drops).toBe(1);
  sampleFps(sample, 2);
  expect(sample.slow).toBe(0);
  usePerformanceTier.setState({ tier: "high", degradation: 0 });
  usePerformanceTier.getState().downgrade();
  expect(usePerformanceTier.getState()).toMatchObject({
    tier: "high",
    degradation: 1,
  });
  usePerformanceTier.getState().downgrade();
  expect(usePerformanceTier.getState().tier).toBe("medium");
  usePerformanceTier.getState().downgrade();
  expect(usePerformanceTier.getState().tier).toBe("low");
});
