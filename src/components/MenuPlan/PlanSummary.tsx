"use client";
import { useSiteStore } from "@/store/useSiteStore";
import { styleById } from "@/data/styles";
import { colorById } from "@/data/hairStyles";
import { stylistById } from "@/data/stylists";
import { hairUnwovenStyleById } from "@/data/hairUnwovenStyles";
import { menus, yen } from "@/data/menu";
import { go } from "@/lib/navigation";
import type { SiteMode } from "@/lib/constants";
import s from "../experience.module.css";
export function PlanSummary({ full = false }: { full?: boolean }) {
  const state = useSiteStore();
  const editorialStyle = hairUnwovenStyleById(state.editorialStyleId);
  const selected = menus.filter((menu) =>
    state.selectedMenus.includes(menu.id),
  );
  const rows: { label: string; value: string; mode: SiteMode }[] = [
    {
      label: "STYLE",
      value: state.consultation
        ? "相談して決める"
        : (editorialStyle?.title ??
          styleById(state.selectedStyleId)?.name ??
          "相談して決める"),
      mode: "style",
    },
    {
      label: "COLOR",
      value:
        state.selectedStyleId || state.colorChosen
          ? colorById(state.selectedColor).name
          : "相談して決める",
      mode: "color",
    },
    {
      label: "STYLIST",
      value: stylistById(state.selectedStylistId)?.name ?? "指名なし",
      mode: "stylist",
    },
    ...(full
      ? [
          {
            label: "MENU",
            value:
              selected.map((menu) => menu.name).join(" + ") || "相談して決める",
            mode: "menu" as SiteMode,
          },
        ]
      : []),
  ];
  return (
    <div className={s.planSummary} data-testid="plan-summary">
      <dl>
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              {row.value}
              {full && (
                <button
                  className={s.changeButton}
                  aria-label={"CHANGE " + row.label}
                  onClick={() => go(row.mode)}
                >
                  CHANGE →
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {state.nominationFee > 0 && (
        <div className={s.feeLine}>
          <span>STYLIST FEE / 指名料</span>
          <span>{yen(state.nominationFee)}</span>
        </div>
      )}
      <div className={s.planTotal} aria-live="polite">
        <span>
          {full ? "ESTIMATE" : "TOTAL"}
          <small>税込・参考価格 / 指名料を含む</small>
        </span>
        <strong data-testid="estimated-price">
          {state.estimatedPrice ? yen(state.estimatedPrice) + "〜" : "要相談"}
        </strong>
      </div>
      <div className={s.planTime}>
        <span>ESTIMATED TIME</span>
        <span data-testid="estimated-time">
          {state.estimatedTime.min
            ? state.estimatedTime.min + "–" + state.estimatedTime.max + " MIN"
            : "カウンセリングでご案内"}
        </span>
      </div>
    </div>
  );
}
