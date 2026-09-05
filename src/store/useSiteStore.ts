"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { HairColor } from "@/data/hairStyles";
import { styleById } from "@/data/styles";
import { stylistById } from "@/data/stylists";
import { menus } from "@/data/menu";
import { wrapAngle, type SiteMode } from "@/lib/constants";
import {
  initialSelection,
  reconcileSelection,
  restoreSelection,
  isHairColor,
  type Selection,
} from "@/lib/selection";
export type SiteState = Selection & {
  mode: SiteMode;
  salonOpen: boolean;
  viewerOpen: boolean;
  hasRotated: boolean;
  setMode: (mode: SiteMode) => void;
  setStyle: (id: string | null) => void;
  setColor: (color: HairColor) => void;
  setAngle: (angle: number) => void;
  setStylist: (id: string | null) => void;
  toggleMenu: (id: string) => void;
  toggleSalon: () => void;
  setSalonOpen: (open: boolean) => void;
  setViewerOpen: (open: boolean) => void;
  markRotated: () => void;
  setConsultation: (value: boolean) => void;
  resetSelection: () => void;
};
export const useSiteStore = create<SiteState>()(
  persist(
    (set) => ({
      ...reconcileSelection(initialSelection),
      mode: "home",
      salonOpen: false,
      viewerOpen: false,
      hasRotated: false,
      setMode: (mode) => set({ mode }),
      setStyle: (id) =>
        set((state) => {
          const style = styleById(id);
          if (!style) return state;
          if (style.id === state.selectedStyleId)
            return state.consultation ? { consultation: false } : state;
          const selectedColor =
            (!state.selectedStyleId && !state.colorChosen) ||
            !style.availableColors.includes(state.selectedColor)
              ? style.defaultColor
              : state.selectedColor;
          return reconcileSelection({
            ...state,
            selectedStyleId: style.id,
            selectedColor,
            selectedStylistId: style.stylistId,
            consultation: false,
          });
        }),
      setColor: (color) =>
        set((state) => {
          const style = styleById(state.selectedStyleId);
          if (
            !isHairColor(color) ||
            (style && !style.availableColors.includes(color))
          )
            return state;
          return reconcileSelection({
            ...state,
            selectedColor: color,
            colorChosen: true,
          });
        }),
      setAngle: (angle) =>
        set((state) =>
          Number.isFinite(angle) ? { selectedAngle: wrapAngle(angle) } : state,
        ),
      setStylist: (id) =>
        set((state) =>
          id !== null && !stylistById(id)
            ? state
            : reconcileSelection({ ...state, selectedStylistId: id }),
        ),
      toggleMenu: (id) =>
        set((state) => {
          if (
            state.recommendedMenus.includes(id) ||
            !menus.some((menu) => menu.id === id)
          )
            return state;
          return reconcileSelection({
            ...state,
            optionalMenus: state.optionalMenus.includes(id)
              ? state.optionalMenus.filter((item) => item !== id)
              : [...state.optionalMenus, id],
          });
        }),
      toggleSalon: () => set((state) => ({ salonOpen: !state.salonOpen })),
      setSalonOpen: (salonOpen) => set({ salonOpen }),
      setViewerOpen: (viewerOpen) => set({ viewerOpen }),
      markRotated: () => set({ hasRotated: true }),
      setConsultation: (consultation) => set({ consultation }),
      resetSelection: () =>
        set({
          ...reconcileSelection(initialSelection),
          viewerOpen: false,
          hasRotated: false,
        }),
    }),
    {
      name: "noir-selection-v2",
      version: 2,
      storage: createJSONStorage(() => ({
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch {
            /* Keep the current in-memory selection when storage is unavailable. */
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
          } catch {
            /* Storage may be blocked by browser settings. */
          }
        },
      })),
      skipHydration: true,
      partialize: (state) => ({
        selectedStyleId: state.selectedStyleId,
        selectedColor: state.selectedColor,
        selectedAngle: state.selectedAngle,
        selectedStylistId: state.selectedStylistId,
        optionalMenus: state.optionalMenus,
        colorChosen: state.colorChosen,
        consultation: state.consultation,
      }),
      merge: (saved, current) => ({ ...current, ...restoreSelection(saved) }),
    },
  ),
);
