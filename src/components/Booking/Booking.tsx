"use client";
import { useState } from "react";
import { useSiteStore } from "@/store/useSiteStore";
import { styleById } from "@/data/styles";
import { colorById } from "@/data/hairStyles";
import { createBookingMessage } from "@/lib/createBookingMessage";
import { go } from "@/lib/navigation";
import { HairImage } from "../ui/HairImage";
import { Modal } from "../ui/Modal";
import { PlanSummary } from "../MenuPlan/PlanSummary";
import { ResetSelection } from "../ResetSelection/ResetSelection";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
import { site } from "@/config/site";
import { createLineBookingUrl, createMaterialWebBookingUrl, createPortraitWebBookingUrl } from "@/lib/bookingUrl";
import { MaterialBookingSelection, useMaterialBookingSelection } from "../HairMaterialLab/MaterialBookingSelection";
import { materialBookingMessage } from "../HairMaterialLab/model";
import { PortraitBookingSelection, usePortraitBookingSelection } from "../DepthHairPortrait/PortraitBookingSelection";
import { portraitBookingMessage } from "../DepthHairPortrait/model";
import { track } from "@/lib/analytics";
import { selectionProperties } from "@/lib/selectionAnalytics";
import { hairUnwovenStyleById } from "@/data/hairUnwovenStyles";
export function Booking() {
  const state = useSiteStore();
  const style = styleById(state.selectedStyleId);
  const editorialStyle = hairUnwovenStyleById(state.editorialStyleId);
  const [notice, setNotice] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const materialSelection = useMaterialBookingSelection();
  const portraitSelection = usePortraitBookingSelection();
  const exclusiveSelection = materialSelection || portraitSelection;
  const message = portraitSelection ? portraitBookingMessage(portraitSelection) : materialSelection ? materialBookingMessage(materialSelection) : createBookingMessage(state);
  const lineUrl = createLineBookingUrl(site.lineUrl, message);
  const webUrl = portraitSelection ? createPortraitWebBookingUrl(site.webUrl, portraitSelection) : materialSelection ? createMaterialWebBookingUrl(site.webUrl, materialSelection) : site.webUrl;
  return (
    <section className={s.contentPage} aria-labelledby="booking-title">
      <div className={s.bookingLayout}>
        <div className={s.bookingIntro}>
          <span className={s.eyebrow}>06 / YOUR NEXT CHAPTER</span>
          <h1 id="booking-title">
            YOUR STYLE
            <br />
            IS <em>READY.</em>
          </h1>
          <p>
            あなたらしい、その先へ。
            <br />
            サロンで、このイメージをかたちに。
          </p>
          {style && !exclusiveSelection && (
            <figure className={s.bookingLook}>
              <div>
                <HairImage
                  src={
                    style.hairImages[state.selectedColor]?.[
                      state.selectedAngle
                    ] ?? "/images/placeholder.svg"
                  }
                  alt={style.name + " / " + colorById(state.selectedColor).name}
                  sizes="(max-width:700px) 88vw, 30vw"
                  data-testid="booking-image"
                />
              </div>
              <figcaption>
                <span>YOUR STYLE / {editorialStyle?.title ?? style.name}</span>
                <span>{colorById(state.selectedColor).name}</span>
              </figcaption>
            </figure>
          )}
          {!exclusiveSelection && <div className={s.consultation}>
            <span>まだスタイルが決まっていない方</span>
            <button
              aria-pressed={state.consultation}
              onClick={() => {
                state.setConsultation(!state.consultation);
                setNotice("");
              }}
            >
              {state.consultation
                ? "✓ 相談プランを選択中"
                : "CONSULTATION / 相談して決める"}{" "}
              <Arrow />
            </button>
            <p>今の選択を残したまま、ご相談いただけます。</p>
          </div>}
        </div>
        <div className={s.bookingPanel}>
          <div className={s.planPanelTitle}>
            <span className={s.eyebrow}>YOUR PERSONAL PLAN</span>
            <span>↗</span>
          </div>
          {portraitSelection ? <PortraitBookingSelection selection={portraitSelection} /> : materialSelection ? <MaterialBookingSelection selection={materialSelection} /> : <PlanSummary full />}
          <div className={s.bookingActions}>
            {lineUrl ? (
              <a
                className={s.primaryButton}
                href={lineUrl}
                rel="noopener noreferrer"
                onClick={() =>
                  track("booking_line_click", {
                    ...selectionProperties(),
                    configured: true,
                  })
                }
              >
                LINEで予約 <Arrow direction="up" />
              </a>
            ) : (
              <button
                className={s.primaryButton}
                onClick={() => {
                  track("booking_line_click", {
                    ...selectionProperties(),
                    configured: false,
                  });
                  setMessageOpen(true);
                  setNotice(
                    "LINE予約は準備中です。予約文を確認できます。予約は送信されません。",
                  );
                }}
              >
                LINEで予約 <Arrow direction="up" />
              </button>
            )}
            {webUrl ? (
              <a
                className={s.outlineButton}
                href={webUrl}
                rel="noopener noreferrer"
                onClick={() =>
                  track("booking_web_click", {
                    ...selectionProperties(),
                    configured: true,
                  })
                }
              >
                WEBで予約 <Arrow direction="up" />
              </a>
            ) : (
              <button
                className={s.outlineButton}
                onClick={() => {
                  track("booking_web_click", {
                    ...selectionProperties(),
                    configured: false,
                  });
                  setNotice("WEB予約は準備中です。予約は送信されません。");
                }}
              >
                WEBで予約 <Arrow direction="up" />
              </button>
            )}
          </div>
          <p role="status" className={s.notice}>
            {notice ||
              (lineUrl || site.webUrl
                ? "予約先の画面で内容を確認し、予約を完了してください。"
                : "予約先は準備中です。LINEボタンから予約文を確認できます。")}
          </p>
          <button className={s.textButton} onClick={() => setMessageOpen(true)}>
            予約メッセージを確認 →
          </button>
          {!exclusiveSelection && <button className={s.textButton} onClick={() => go("menu")}>
            ← メニューを調整する
          </button>}
          {!exclusiveSelection && <ResetSelection />}
        </div>
      </div>
      <Modal
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        title="LINE MESSAGE PREVIEW"
        id="booking-message"
      >
        <h2 className={s.messageTitle}>あなたの希望を、サロンへ。</h2>
        <label className={s.messageLabel} htmlFor="booking-message-text">
          生成した予約文
        </label>
        <textarea
          id="booking-message-text"
          className={s.bookingMessage}
          readOnly
          value={message}
        />
        <button
          className={s.primaryButton}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message);
              setNotice("予約文をコピーしました。予約は送信されていません。");
            } catch {
              setNotice(
                "コピーできませんでした。予約文を選択してコピーしてください。",
              );
            }
          }}
        >
          予約文をコピー <Arrow />
        </button>
        <p className={s.notice} role="status">
          {notice || "この画面では外部へ送信しません。"}
        </p>
      </Modal>
    </section>
  );
}
