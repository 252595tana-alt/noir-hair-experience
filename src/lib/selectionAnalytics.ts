import { useSiteStore } from "@/store/useSiteStore";
import { track } from "./analytics";
export const selectionProperties = () => {
  const s = useSiteStore.getState();
  return {
    styleId: s.selectedStyleId,
    color: s.selectedColor,
    stylistId: s.selectedStylistId,
    menus: s.selectedMenus,
  };
};
export function subscribeSelectionAnalytics() {
  return useSiteStore.subscribe((s, p) => {
    const data = selectionProperties();
    if (s.selectedStyleId !== p.selectedStyleId && s.selectedStyleId)
      track("style_select", data);
    if (s.selectedStylistId !== p.selectedStylistId && s.selectedStylistId)
      track("stylist_select", data);
    if (s.selectedAngle !== p.selectedAngle)
      track("hair_rotate", { ...data, angle: s.selectedAngle });
    if (s.salonOpen && !p.salonOpen) track("salon_open", data);
    if (s.mode !== p.mode) {
      const events = {
        style: "style_view",
        stylist: "stylist_view",
        menu: "menu_view",
        booking: "booking_open",
      } as const;
      const event = events[s.mode as keyof typeof events];
      if (event) track(event, data);
    }
  });
}
