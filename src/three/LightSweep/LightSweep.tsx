"use client";
import { usePreviewStore } from "../previewStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useState } from "react";
export function LightSweep() {
  const id = usePreviewStore((s) => s.applyId);
  const appliedAt = usePreviewStore((s) => s.appliedAt);
  const [mountedAt] = useState(() => performance.now());
  const reduced = useReducedMotion();
  return id && appliedAt >= mountedAt && !reduced ? (
    <span key={id} aria-hidden="true" className="hair-light-sweep" />
  ) : null;
}
