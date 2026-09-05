"use client";
import { useSiteStore } from "@/store/useSiteStore";
import { styles, styleById, styleBySlug } from "@/data/styles";
import { stylists, stylistById } from "@/data/stylists";
import { isHairColor } from "./selection";
import { routes, modeFromPath, type SiteMode } from "./constants";
import { pageInfo } from "./seo";
const locationPath = () => window.location.pathname + window.location.search;
export function selectionPath(mode: SiteMode): string {
  const state = useSiteStore.getState();
  const style = styleById(state.selectedStyleId);
  const stylist = stylistById(state.selectedStylistId);
  if (mode === "style" && style) return "/style/" + style.slug;
  if (mode === "stylist" && stylist) return "/stylist/" + stylist.slug;
  if (mode === "color") {
    const query = new URLSearchParams();
    if (style) query.set("style", style.slug);
    if (style || state.colorChosen) query.set("color", state.selectedColor);
    return "/color" + (query.size ? "?" + query.toString() : "");
  }
  return routes[mode];
}
export function syncSelectionUrl() {
  const path = window.location.pathname;
  if (!pageInfo(path).found) return;
  if (
    path === "/color" ||
    path === "/style" ||
    path.startsWith("/style/") ||
    path === "/stylist" ||
    path.startsWith("/stylist/")
  ) {
    const target = selectionPath(modeFromPath(path));
    if (locationPath() !== target)
      window.history.replaceState(null, "", target);
  }
}
export function go(mode: SiteMode, path?: string) {
  const state = useSiteStore.getState();
  if ((mode === "style" || mode === "color") && !state.selectedStyleId)
    state.setStyle(styles[0].id);
  if (mode === "stylist" && !state.selectedStylistId)
    state.setStylist(stylists[0].id);
  useSiteStore.setState({ mode, salonOpen: false });
  const target = path ?? selectionPath(mode);
  if (locationPath() !== target) window.history.pushState(null, "", target);
  window.scrollTo({ top: 0, behavior: "instant" });
}
/** Apply a shared URL once on document entry. Back/Forward never replay old selections. */
export function initializeFromUrl() {
  const url = new URL(window.location.href);
  const path = url.pathname;
  if (!pageInfo(path).found) return;
  const state = useSiteStore.getState();
  const style = path.startsWith("/style/")
    ? styleBySlug(path.split("/")[2])
    : path === "/color"
      ? styleBySlug(url.searchParams.get("style") ?? "")
      : undefined;
  if (style) state.setStyle(style.id);
  else if ((path === "/style" || path === "/color") && !state.selectedStyleId)
    state.setStyle(styles[0].id);
  if (path === "/color") {
    const color = url.searchParams.get("color");
    if (isHairColor(color)) useSiteStore.getState().setColor(color);
  }
  if (path.startsWith("/stylist/")) {
    const stylist = stylists.find(
      (person) => person.slug === path.split("/")[2],
    );
    if (stylist) state.setStylist(stylist.id);
  } else if (path === "/stylist" && !state.selectedStylistId)
    state.setStylist(stylists[0].id);
  applyLocationMode();
}
export function applyLocationMode() {
  const path = window.location.pathname;
  if (!pageInfo(path).found) return;
  if (path === "/salon") {
    useSiteStore.getState().setSalonOpen(true);
    return;
  }
  useSiteStore.setState({ mode: modeFromPath(path), salonOpen: false });
}
export function openSalon() {
  if (window.location.pathname === "/salon") return;
  const from = locationPath();
  useSiteStore.getState().setSalonOpen(true);
  window.history.pushState({ noirSalonFrom: from }, "", "/salon");
}
export function closeSalon() {
  useSiteStore.getState().setSalonOpen(false);
  if (window.history.state?.noirSalonFrom) window.history.back();
  else {
    window.history.replaceState(null, "", "/");
    useSiteStore.getState().setMode("home");
  }
}
