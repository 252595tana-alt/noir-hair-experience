"use client";
import { useSyncExternalStore } from "react";
import { parseMaterialSelection, type HairMaterialSelection } from "./model";
import s from "./HairMaterialLab.module.css";

const subscribe = (notify: () => void) => {
  window.addEventListener("popstate", notify);
  return () => window.removeEventListener("popstate", notify);
};
export function useMaterialBookingSelection() {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  return parseMaterialSelection(new URLSearchParams(search));
}
export function MaterialBookingSelection({ selection }: { selection: HairMaterialSelection }) {
  return <div className={s.bookingSelection} data-testid="material-booking-selection">
    <p>HAIR MATERIAL LAB / YOUR SELECTION</p>
    <dl>{Object.entries(selection).map(([key, value]) => <div key={key}><dt>{key.toUpperCase()}</dt><dd>{value.toUpperCase()}</dd></div>)}</dl>
    <small>この組み合わせを予約文へ引き継ぎます。施術・料金・所要時間はカウンセリングでご案内します。</small>
  </div>;
}
