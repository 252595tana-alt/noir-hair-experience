import { hairColors, type HairColor } from "@/data/hairStyles";
import { styleById } from "@/data/styles";
import { stylistById } from "@/data/stylists";
import { menus, estimate, timeBufferMin } from "@/data/menu";
import { colorMenuRequirements } from "@/data/colorMenus";
import { wrapAngle } from "./constants";
import {
  hairUnwovenStyleById,
  type HairUnwovenStyleId,
} from "@/data/hairUnwovenStyles";
export type SelectionInput = {
  selectedStyleId: string | null;
  editorialStyleId: HairUnwovenStyleId | null;
  selectedColor: HairColor;
  selectedAngle: number;
  selectedStylistId: string | null;
  optionalMenus: string[];
  colorChosen: boolean;
  consultation: boolean;
};
export type Selection = SelectionInput & {
  selectedMenus: string[];
  recommendedMenus: string[];
  estimatedPrice: number;
  estimatedTime: { min: number; max: number };
  nominationFee: number;
};
export const initialSelection: SelectionInput = {
  selectedStyleId: null,
  editorialStyleId: null,
  selectedColor: "black",
  selectedAngle: 0,
  selectedStylistId: null,
  optionalMenus: [],
  colorChosen: false,
  consultation: false,
};
export function isHairColor(value: unknown): value is HairColor {
  return hairColors.some((color) => color.id === value);
}
export function reconcileSelection(input: SelectionInput): Selection {
  const style = styleById(input.selectedStyleId);
  const editorialStyle = hairUnwovenStyleById(input.editorialStyleId);
  const color =
    style && !style.availableColors.includes(input.selectedColor)
      ? style.defaultColor
      : input.selectedColor;
  const required = [
    ...(style?.recommendedMenus ?? []),
    ...(style || input.colorChosen ? colorMenuRequirements[color] : []),
  ];
  const recommendedMenus = menus
    .filter((menu) => required.includes(menu.id))
    .map((menu) => menu.id);
  const optionalMenus = menus
    .filter((menu) => input.optionalMenus.includes(menu.id))
    .map((menu) => menu.id);
  const selectedMenus = menus
    .filter(
      (menu) =>
        recommendedMenus.includes(menu.id) || optionalMenus.includes(menu.id),
    )
    .map((menu) => menu.id);
  const nominationFee =
    stylistById(input.selectedStylistId)?.nominationFee ?? 0;
  const plan = estimate(selectedMenus, nominationFee);
  return {
    ...input,
    editorialStyleId:
      editorialStyle && editorialStyle.styleId === style?.id
        ? editorialStyle.id
        : null,
    selectedColor: color,
    optionalMenus,
    selectedMenus,
    recommendedMenus,
    nominationFee,
    estimatedPrice: plan.total,
    estimatedTime: {
      min: plan.minutes,
      max: plan.minutes ? plan.minutes + timeBufferMin : 0,
    },
  };
}
export function restoreSelection(value: unknown): Selection {
  const data =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const style =
    typeof data.selectedStyleId === "string"
      ? styleById(data.selectedStyleId)
      : undefined;
  const stylist =
    typeof data.selectedStylistId === "string"
      ? stylistById(data.selectedStylistId)
      : undefined;
  return reconcileSelection({
    selectedStyleId: style?.id ?? null,
    editorialStyleId:
      typeof data.editorialStyleId === "string" &&
      hairUnwovenStyleById(data.editorialStyleId)?.styleId === style?.id
        ? (data.editorialStyleId as HairUnwovenStyleId)
        : null,
    selectedColor: isHairColor(data.selectedColor)
      ? data.selectedColor
      : (style?.defaultColor ?? "black"),
    selectedAngle:
      typeof data.selectedAngle === "number" &&
      Number.isFinite(data.selectedAngle)
        ? wrapAngle(data.selectedAngle)
        : 0,
    selectedStylistId: stylist?.id ?? null,
    optionalMenus: Array.isArray(data.optionalMenus)
      ? data.optionalMenus.filter((id): id is string => typeof id === "string")
      : [],
    colorChosen: data.colorChosen === true,
    consultation: data.consultation === true,
  });
}
