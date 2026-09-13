"use client";
import { useSyncExternalStore } from "react";
import { parseRevealSelection, revealStyles, type RevealSelection } from "./model";
import s from "./HairColorParticleReveal.module.css";

const subscribe = (notify: () => void) => {
  window.addEventListener("popstate", notify);
  return () => window.removeEventListener("popstate", notify);
};
export function useRevealBookingSelection() {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  return parseRevealSelection(new URLSearchParams(search));
}
export function RevealBookingSelection({ selection }: { selection: RevealSelection }) {
  return <div className={s.bookingSelection} data-testid="reveal-booking-selection">
    <p>HAIR COLOR PARTICLE REVEAL / YOUR SELECTION</p>
    <dl><div><dt>STYLE</dt><dd>{revealStyles[selection.style].name}</dd></div>
      <div><dt>COLOR</dt><dd>{selection.color.toUpperCase()}</dd></div></dl>
    <small>このスタイルとカラーを予約文へ引き継ぎます。施術・料金・所要時間はカウンセリングでご案内します。</small>
  </div>;
}
