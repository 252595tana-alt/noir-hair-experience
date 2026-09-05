"use client";
import { Component, type ReactNode } from "react";
import { closeSalon } from "@/lib/navigation";
import { Modal } from "./Modal";
import s from "../experience.module.css";

export function ModeLoading({ label }: { label: string }) {
  return (
    <div className={`${s.contentPage} ${s.modeNotice}`} role="status" aria-live="polite">
      <span className={s.eyebrow}>{label}</span>
      <p>読み込んでいます…</p>
    </div>
  );
}

export function SalonLoading() {
  return (
    <Modal open onClose={closeSalon} title="SALON" id="salon-loading">
      <p role="status">読み込んでいます…</p>
    </Modal>
  );
}

/** The selection lives outside this boundary and survives a chunk failure. */
export class ModeBoundary extends Component<
  { children: ReactNode; isSalon?: boolean },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      const content = (
        <section className={`${this.props.isSalon ? "" : s.contentPage} ${s.modeNotice}`} role="alert">
          <h1>画面を読み込めませんでした</h1>
          <p>通信状況を確認して、もう一度お試しください。</p>
          <button className={s.outlineButton} onClick={() => window.location.reload()}>
            再読み込みする
          </button>
        </section>
      );
      return this.props.isSalon ? (
        <Modal open onClose={closeSalon} title="SALON" id="salon-error">{content}</Modal>
      ) : content;
    }
    return this.props.children;
  }
}
