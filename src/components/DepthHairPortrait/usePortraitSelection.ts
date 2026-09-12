"use client";
import { useSyncExternalStore } from "react";
import { defaultPortraitSelection, validatePortraitSelection, type DepthPortraitSelection } from "./model";

const storageKey = "noir-depth-portrait-v1";
const changeEvent = "noir:depth-portrait-selection";
let cached = defaultPortraitSelection;
let lastRaw: string | null | undefined;
function snapshot() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== lastRaw) {
      lastRaw = raw;
      try { cached = validatePortraitSelection(raw ? JSON.parse(raw) : null) ?? defaultPortraitSelection; }
      catch { cached = defaultPortraitSelection; }
    }
  } catch { /* Retain this tab's selection when storage is unavailable. */ }
  return cached;
}
function subscribe(notify: () => void) {
  const stored = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) notify(); };
  window.addEventListener("storage", stored);
  window.addEventListener(changeEvent, notify);
  return () => { window.removeEventListener("storage", stored); window.removeEventListener(changeEvent, notify); };
}
export function setPortraitSelection(selection: DepthPortraitSelection) {
  const valid = validatePortraitSelection(selection);
  if (!valid) return;
  cached = valid;
  try {
    const raw = JSON.stringify(valid);
    localStorage.setItem(storageKey, raw);
    lastRaw = raw;
  } catch { /* Memory remains usable. */ }
  window.dispatchEvent(new Event(changeEvent));
}
export function usePortraitSelection() {
  return useSyncExternalStore(subscribe, snapshot, () => defaultPortraitSelection);
}
