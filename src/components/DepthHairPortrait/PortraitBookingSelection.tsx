"use client";
import { useSyncExternalStore } from "react";
import { depthPortraits, parsePortraitSelection, type DepthPortraitSelection } from "./model";
import s from "./DepthHairPortrait.module.css";

const subscribe = (notify: () => void) => {
  window.addEventListener("popstate", notify);
  return () => window.removeEventListener("popstate", notify);
};
export function usePortraitBookingSelection() {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  return parsePortraitSelection(new URLSearchParams(search));
}
export function PortraitBookingSelection({ selection }: { selection: DepthPortraitSelection }) {
  return <div className={s.bookingSelection} data-testid="portrait-booking-selection">
    <p>DEPTH HAIR PORTRAIT / YOUR SELECTION</p>
    <dl><div><dt>STYLE</dt><dd>{depthPortraits[selection.style].name}</dd></div>
      <div><dt>COLOR</dt><dd>{selection.color.toUpperCase()}</dd></div></dl>
    <small>このスタイルとカラーを予約文へ引き継ぎます。施術・料金・所要時間はカウンセリングでご案内します。</small>
  </div>;
}
