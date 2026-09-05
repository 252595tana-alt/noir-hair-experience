"use client";
import { useEffect, useRef } from "react";
import { useMotion } from "@/lib/useMotion";
import s from "../experience.module.css";
export function Modal({
  open,
  onClose,
  title,
  id,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useMotion(body, String(open), "quiet");
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      const trigger =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      el.showModal();
      const before = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        el.close();
        document.body.style.overflow = before;
        if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      };
    }
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      aria-labelledby={`${id}-title`}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={body} className={s.dialogBody}>
        <div className={s.dialogHeading}>
          <span id={`${id}-title`} className={s.eyebrow}>
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label={`${title}を閉じる`}
            className={s.close}
          >
            CLOSE <span>×</span>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
