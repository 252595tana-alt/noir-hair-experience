import { styleById } from "@/data/styles";
import { colorById } from "@/data/hairStyles";
import { stylistById } from "@/data/stylists";
import { menus } from "@/data/menu";
import type { Selection } from "./selection";
import { hairUnwovenStyleById } from "@/data/hairUnwovenStyles";
export function createBookingMessage(
  state: Pick<
    Selection,
    | "selectedStyleId"
    | "editorialStyleId"
    | "selectedColor"
    | "selectedStylistId"
    | "selectedMenus"
    | "colorChosen"
    | "consultation"
  >,
): string {
  const style = styleById(state.selectedStyleId);
  const editorialStyle = hairUnwovenStyleById(state.editorialStyleId);
  if (state.consultation) return "スタイルについて相談希望です。";
  const stylist = stylistById(state.selectedStylistId);
  const selected = menus.filter((menu) =>
    state.selectedMenus.includes(menu.id),
  );
  return [
    style
      ? (editorialStyle?.title ?? style.name) + "のスタイルで、"
      : "スタイルについて相談希望です。",
    ...(style || state.colorChosen
      ? [colorById(state.selectedColor).name + "カラーを希望しています。"]
      : []),
    ...(stylist
      ? [stylist.name + "さんを指名希望です。"]
      : style
        ? ["スタイリストの指名はありません。"]
        : []),
    ...(selected.length
      ? ["", "希望メニュー：", selected.map((menu) => menu.name).join(" / ")]
      : []),
  ].join("\n");
}
