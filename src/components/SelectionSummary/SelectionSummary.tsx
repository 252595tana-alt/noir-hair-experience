"use client";
import { useSiteStore } from "@/store/useSiteStore";
import { styleById } from "@/data/styles";
import { colorById } from "@/data/hairStyles";
import { stylistById } from "@/data/stylists";
import { go } from "@/lib/navigation";
import s from "../experience.module.css";
export function SelectionSummary() {
  const state = useSiteStore();
  if (
    state.mode === "home" ||
    state.mode === "booking" ||
    (!state.selectedStyleId && !state.colorChosen && !state.selectedStylistId)
  )
    return null;
  return (
    <aside className={s.selectionSummary} aria-label="現在の選択">
      <span className={s.eyebrow}>YOUR SELECTION</span>
      <p>
        {styleById(state.selectedStyleId)?.name ?? "STYLE / 相談"}
        <br />
        {colorById(state.selectedColor).name}
        <br />
        {stylistById(state.selectedStylistId)?.name ?? "指名なし"}
      </p>
      <button onClick={() => go("booking")}>VIEW YOUR PLAN ↗</button>
    </aside>
  );
}
