"use client";
import { create } from "zustand";
import { reducedData } from "./useReducedData";
export type PerformanceTier = "high" | "medium" | "low";
export const qualityProfiles = {
  high: { dpr: 1.5, particles: 2000, noise: 1 },
  medium: { dpr: 1.25, particles: 1000, noise: 0.4 },
  low: { dpr: 1, particles: 400, noise: 0 },
};
export const usePerformanceTier = create<{
  tier: PerformanceTier;
  initialized: boolean;
  degradation: number;
  mobile: boolean;
  initialize: () => void;
  downgrade: () => void;
}>((set, get) => ({
  tier: "low",
  initialized: false,
  degradation: 0,
  mobile: false,
  initialize: () => {
    if (get().initialized) return;
    const cores = navigator.hardwareConcurrency || 4;
    const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 768;
    const pixels = screen.width * screen.height * Math.min(devicePixelRatio, 2);
    set({
      initialized: true,
      mobile,
      tier:
        cores <= 2 || reducedData()
          ? "low"
          : mobile || cores < 8 || pixels > 8000000
            ? "medium"
            : "high",
    });
  },
  // First reduce geometry, then shader complexity, finally remove the lens.
  // Postprocessing is deliberately absent at every tier.
  downgrade: () => {
    const { degradation, tier } = get();
    if (degradation < 1) set({ degradation: 1 });
    else if (tier === "high") set({ tier: "medium", degradation: 2 });
    else if (tier === "medium") set({ tier: "low", degradation: 3 });
  },
}));
