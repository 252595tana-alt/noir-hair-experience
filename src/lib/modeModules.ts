import { styles } from "@/data/styles";
import { useSiteStore } from "@/store/useSiteStore";
import { preloadImages } from "./preload";
import { reducedData } from "@/hooks/useReducedData";
import type { SiteMode } from "./constants";
export const loadBooking = () => import("@/components/Booking/Booking");
export const loadStylist = () =>
  import("@/components/StylistExperience/StylistExperience");
export const loadSalon = () => import("@/components/SalonOverlay/SalonOverlay");
export const loadMenu = () => import("@/components/MenuPlan/MenuPlan");
export function prefetchMode(mode: SiteMode | "salon") {
  if (reducedData()) return;
  if (mode === "booking") void loadBooking();
  else if (mode === "stylist") void loadStylist();
  else if (mode === "salon") void loadSalon();
  else if (mode === "menu") void loadMenu();
  else if (mode === "style" || mode === "color") {
    const s = useSiteStore.getState();
    const style = styles.find((x) => x.id === s.selectedStyleId) ?? styles[0];
    preloadImages([
      mode === "style"
        ? style.heroImage
        : style.hairImages[s.selectedColor][s.selectedAngle],
    ]);
  }
}
