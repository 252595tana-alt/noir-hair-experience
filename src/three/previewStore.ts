"use client";
import { create } from "zustand";
import type { HairColor } from "@/data/hairStyles";
import { useSiteStore } from "@/store/useSiteStore";
import { styleById } from "@/data/styles";
import { track } from "@/lib/analytics";
import { selectionProperties } from "@/lib/selectionAnalytics";
export const usePreviewStore = create<{
  styleId: string | null;
  base: HairColor;
  candidate: HairColor | null;
  applyId: number;
  from: HairColor;
  appliedAt: number;
  tryColor: (color: HairColor) => void;
  apply: () => void;
}>((set, get) => ({
  styleId: null,
  base: "black",
  candidate: null,
  applyId: 0,
  from: "black",
  appliedAt: 0,
  tryColor: (candidate) => {
    const state = useSiteStore.getState();
    if (!styleById(state.selectedStyleId)?.availableColors.includes(candidate))
      return;
    set({
      candidate,
      base: state.selectedColor,
      styleId: state.selectedStyleId,
    });
    track("color_try", { ...selectionProperties(), color: candidate });
  },
  apply: () => {
    const preview = get(),
      state = useSiteStore.getState();
    if (
      !preview.candidate ||
      preview.styleId !== state.selectedStyleId ||
      preview.base !== state.selectedColor
    )
      return;
    set({
      from: state.selectedColor,
      appliedAt: performance.now(),
      applyId: preview.applyId + 1,
      candidate: null,
    });
    // Selection is committed atomically. Visual progress never owns booking state.
    state.setColor(preview.candidate);
    track("color_apply", selectionProperties());
  },
}));
export function useTryColor() {
  const preview = usePreviewStore();
  const color = useSiteStore((s) => s.selectedColor);
  const style = useSiteStore((s) => s.selectedStyleId);
  return preview.styleId === style && preview.base === color
    ? (preview.candidate ?? color)
    : color;
}

// Discard stale visual drafts on RESET, direct selection edits, or style changes.
// Never subscribe booking state to animation progress.
useSiteStore.subscribe((state, previous) => {
  if (
    state.selectedStyleId !== previous.selectedStyleId ||
    state.selectedColor !== previous.selectedColor
  ) {
    usePreviewStore.setState({ candidate: null });
  }
});
