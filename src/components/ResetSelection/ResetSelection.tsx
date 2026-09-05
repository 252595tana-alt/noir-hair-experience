"use client";
import { useState } from "react";
import { useSiteStore } from "@/store/useSiteStore";
import { go } from "@/lib/navigation";
import { Modal } from "../ui/Modal";
import s from "../experience.module.css";
export function ResetSelection() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={s.resetButton} onClick={() => setOpen(true)}>
        RESET SELECTION
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="RESET SELECTION"
        id="reset-selection"
      >
        <div className={s.resetContent}>
          <h2>選択内容をリセットしますか？</h2>
          <p>
            スタイル・カラー・角度・スタイリスト・メニューを初期状態に戻します。
          </p>
          <button className={s.outlineButton} onClick={() => setOpen(false)}>
            キャンセル
          </button>
          <button
            className={s.primaryButton}
            onClick={() => {
              const mode = useSiteStore.getState().mode;
              useSiteStore.getState().resetSelection();
              setOpen(false);
              go(mode);
            }}
          >
            リセットする
          </button>
        </div>
      </Modal>
    </>
  );
}
