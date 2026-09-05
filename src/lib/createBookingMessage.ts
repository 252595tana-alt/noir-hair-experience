import { styleById } from "@/data/styles";
import { colorById } from "@/data/hairStyles";
import { stylistById } from "@/data/stylists";
import { menus } from "@/data/menu";
import type { Selection } from "./selection";
export function createBookingMessage(
  state: Pick<
    Selection,
    | "selectedStyleId"
    | "selectedColor"
    | "selectedStylistId"
    | "selectedMenus"
    | "consultation"
  >,
): string {
  const style = styleById(state.selectedStyleId);
  if (state.consultation || !style) return "スタイルについて相談希望です。";
  const stylist = stylistById(state.selectedStylistId);
  const selected = menus.filter((menu) =>
    state.selectedMenus.includes(menu.id),
  );
  return [
    style.name + "のスタイルで、",
    colorById(state.selectedColor).name + "カラーを希望しています。",
    stylist
      ? stylist.name + "さんを指名希望です。"
      : "スタイリストの指名はありません。",
    ...(selected.length
      ? ["", "希望メニュー：", selected.map((menu) => menu.name).join(" / ")]
      : []),
  ].join("\n");
}
