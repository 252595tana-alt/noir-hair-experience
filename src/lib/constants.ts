export const ANGLE_COUNT = 8;
export const DRAG_STEP = 48;
export const wrapAngle = (angle: number) =>
  ((Math.round(angle) % ANGLE_COUNT) + ANGLE_COUNT) % ANGLE_COUNT;
export type SiteMode =
  "home" | "concept" | "style" | "color" | "stylist" | "menu" | "booking";
export const routes: Record<SiteMode, string> = {
  home: "/",
  concept: "/concept",
  style: "/style",
  color: "/color",
  stylist: "/stylist",
  menu: "/menu",
  booking: "/booking",
};
export function modeFromPath(path: string): SiteMode {
  return (Object.entries(routes).find(([, value]) => value === path)?.[0] ??
    (path.startsWith("/style/")
      ? "style"
      : path.startsWith("/stylist/")
        ? "stylist"
        : "home")) as SiteMode;
}
