"use client";
import { useState } from "react";
import { go, openSalon } from "@/lib/navigation";
import { useSiteStore } from "@/store/useSiteStore";
import type { SiteMode } from "@/lib/constants";
import { Modal } from "../ui/Modal";
import s from "../experience.module.css";
export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const mode = useSiteStore((state) => state.mode);
  const navigate = (mode: SiteMode) => {
    setOpen(false);
    go(mode);
  };
  return (
    <>
      <nav className={s.mobileNav} aria-label="モバイルナビゲーション">
        {(["style", "color", "booking"] as const).map((item) => (
          <button
            key={item}
            onClick={() => navigate(item)}
            className={item === "booking" ? s.mobileBook : ""}
            aria-current={mode === item ? "page" : undefined}
          >
            {item === "booking" ? "BOOK ↗" : item.toUpperCase()}
          </button>
        ))}
        <button aria-expanded={open} onClick={() => setOpen(true)}>
          MENU <span>＋</span>
        </button>
      </nav>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="EXPLORE"
        id="mobile-menu"
      >
        <div className={s.mobileMenuLinks}>
          {mode === "home" && <button onClick={() => {
            setOpen(false);
            requestAnimationFrame(() => document.getElementById("hair-material-lab")?.scrollIntoView({ behavior: "instant", block: "start" }));
          }}>MATERIAL LAB ↗</button>}
          {mode === "home" && <button onClick={() => {
            setOpen(false);
            requestAnimationFrame(() => document.getElementById("depth-hair-portrait")?.scrollIntoView({ behavior: "instant", block: "start" }));
          }}>DEPTH PORTRAIT ↗</button>}
          {(["stylist", "menu", "concept"] as const).map((item) => (
            <button key={item} onClick={() => navigate(item)}>
              {item === "menu" ? "MENU / PRICE" : item.toUpperCase()} ↗
            </button>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              openSalon();
            }}
          >
            SALON / ACCESS ↗
          </button>
          <button onClick={() => navigate("home")}>HOME ↗</button>
        </div>
      </Modal>
    </>
  );
}
