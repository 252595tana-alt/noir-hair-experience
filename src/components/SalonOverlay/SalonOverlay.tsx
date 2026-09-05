"use client";
import { useState } from "react";
import { useSiteStore } from "@/store/useSiteStore";
import { closeSalon, go } from "@/lib/navigation";
import { Modal } from "../ui/Modal";
import { Arrow } from "../ui/Arrow";
import s from "../experience.module.css";
import { site, salonDetails } from "@/config/site";
export function SalonOverlay() {
  const open = useSiteStore((state) => state.salonOpen);
  const [notice, setNotice] = useState("");
  return (
    <Modal
      open={open}
      onClose={closeSalon}
      title="07 / SALON & ACCESS"
      id="salon"
    >
      <div className={s.salonContent}>
        <h2>
          {site.name}
          <span>HAIR DESIGN STUDIO</span>
        </h2>
        <p className={s.salonStatement}>
          日常を離れて、
          <br />
          自分に還る場所。
        </p>
        <div className={s.mapGraphic} aria-label="サロン周辺の概念図（デモ）">
          <span className={s.mapStreet}>SALON / ACCESS</span>
          <span className={s.mapPin}>
            ＋<b>{site.name}</b>
          </span>
          <span className={s.mapStation}>
            {site.address || "正式なアクセス情報は準備中です"}
          </span>
        </div>
        <dl className={s.salonInfo}>
          {salonDetails.map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>
                {name === "TEL" && site.phone ? (
                  <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className={s.salonExternal}>
          {site.instagram ? (
            <a href={site.instagram} target="_blank" rel="noopener noreferrer">
              INSTAGRAM ↗
            </a>
          ) : (
            <button onClick={() => setNotice("Instagramは準備中です。")}>
              INSTAGRAM <Arrow direction="up" />
            </button>
          )}
          {site.mapUrl ? (
            <a href={site.mapUrl} target="_blank" rel="noopener noreferrer">
              GOOGLE MAP ↗
            </a>
          ) : (
            <button
              onClick={() =>
                setNotice("Google Mapは正式な住所が決まり次第公開します。")
              }
            >
              GOOGLE MAP <Arrow direction="up" />
            </button>
          )}
          {site.businessProfileUrl && (
            <a
              href={site.businessProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              GOOGLE BUSINESS PROFILE ↗
            </a>
          )}
        </div>
        <p className={s.notice} role="status">
          {notice ||
            (site.verified
              ? "ご来店前に予約内容をご確認ください。"
              : "店舗情報は準備中です。")}
        </p>
        <button className={s.primaryButton} onClick={() => go("booking")}>
          BOOK NOW <Arrow />
        </button>
      </div>
    </Modal>
  );
}
