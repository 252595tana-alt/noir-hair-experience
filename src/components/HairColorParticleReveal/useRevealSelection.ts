"use client";
import { useSyncExternalStore } from "react";
import { defaultRevealSelection, validateRevealSelection, type RevealSelection } from "./model";

export const revealStorageKey = "noir-color-reveal-v1";
const changeEvent = "noir:color-reveal-selection";
let cached = defaultRevealSelection;
let lastRaw: string | null | undefined;
function snapshot() {
  try {
    const raw = localStorage.getItem(revealStorageKey);
    if (raw !== lastRaw) {
      lastRaw = raw;
      try { cached = validateRevealSelection(raw ? JSON.parse(raw) : null) ?? defaultRevealSelection; }
      catch { cached = defaultRevealSelection; }
    }
  } catch { /* Storage can be disabled; retain the in-memory selection. */ }
  return cached;
}
function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === revealStorageKey || event.key === null) notify(); };
  window.addEventListener("storage", storage);
  window.addEventListener(changeEvent, notify);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(changeEvent, notify); };
}
export function setRevealSelection(selection: RevealSelection) {
  const valid = validateRevealSelection(selection);
  if (!valid) return;
  // Read first so a failed write cannot overwrite memory with an old disk value.
  snapshot();
  cached = valid;
  try {
    const raw = JSON.stringify(valid);
    localStorage.setItem(revealStorageKey, raw);
    lastRaw = raw;
  } catch { /* The current tab remains usable. */ }
  window.dispatchEvent(new Event(changeEvent));
}
export function useRevealSelection() {
  return useSyncExternalStore(subscribe, snapshot, () => defaultRevealSelection);
}
