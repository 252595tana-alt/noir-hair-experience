"use client";
import { useSyncExternalStore } from "react";
type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };
const connection = () =>
  (navigator as Navigator & { connection?: Connection }).connection;
export function reducedData() {
  return (
    typeof navigator !== "undefined" &&
    Boolean(
      connection()?.saveData ||
      ["slow-2g", "2g"].includes(connection()?.effectiveType ?? ""),
    )
  );
}
const subscribe = (notify: () => void) => {
  const c = connection();
  c?.addEventListener("change", notify);
  return () => c?.removeEventListener("change", notify);
};
export function useReducedData() {
  return useSyncExternalStore(subscribe, reducedData, () => false);
}
