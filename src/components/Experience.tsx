"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useSiteStore } from "@/store/useSiteStore";
import {
  initializeFromUrl,
  applyLocationMode,
  syncSelectionUrl,
} from "@/lib/navigation";
import { colorById } from "@/data/hairStyles";
import { useMotion } from "@/lib/useMotion";
import { Navigation } from "./Navigation/Navigation";
import { MobileNavigation } from "./MobileNavigation/MobileNavigation";
import { Hero } from "./Hero/Hero";
import { CinematicHairJourney } from "./sections/CinematicHairJourney";
import { HairUnwovenGallery } from "./sections/HairUnwovenGallery";
import { Concept } from "./Hero/Concept";
import { StyleExperience } from "./StyleExperience/StyleExperience";
import { ModeBoundary, ModeLoading, SalonLoading } from "./ui/ModeBoundary";
import {
  loadBooking,
  loadMenu,
  loadSalon,
  loadStylist,
} from "@/lib/modeModules";
const StylistExperience = dynamic(
  () => loadStylist().then((m) => m.StylistExperience),
  { loading: () => <ModeLoading label="STYLIST" /> },
);
const MenuPlan = dynamic(() => loadMenu().then((m) => m.MenuPlan), {
  loading: () => <ModeLoading label="MENU" />,
});
const Booking = dynamic(() => loadBooking().then((m) => m.Booking), {
  loading: () => <ModeLoading label="BOOK" />,
});
const SalonOverlay = dynamic(() => loadSalon().then((m) => m.SalonOverlay), {
  loading: SalonLoading,
});
import { RouteMetadata } from "./RouteMetadata";
import { subscribeSelectionAnalytics } from "@/lib/selectionAnalytics";
import { site } from "@/config/site";
import { pageInfo } from "@/lib/seo";
import { SelectionSummary } from "./SelectionSummary/SelectionSummary";
import s from "./experience.module.css";
import { VisualEnhancements } from "@/three/VisualEnhancements";
export default function Experience({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const salonOpen = useSiteStore((s) => s.salonOpen);
  const pathname = usePathname();
  const mode = useSiteStore((state) => state.mode);
  const color = useSiteStore((state) => state.selectedColor);
  const main = useRef<HTMLElement>(null);
  useMotion(
    main,
    mode,
    mode === "booking" || mode === "menu" ? "quiet" : "mode",
  );
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    void Promise.resolve(useSiteStore.persist.rehydrate()).then(() => {
      if (!active) return;
      initializeFromUrl();
      setReady(true);
      unsubscribe = useSiteStore.subscribe((state, previous) => {
        if (
          state.selectedStyleId !== previous.selectedStyleId ||
          state.selectedColor !== previous.selectedColor ||
          state.selectedStylistId !== previous.selectedStylistId
        )
          syncSelectionUrl();
      });
    });
    const onPop = () => {
      applyLocationMode();
      syncSelectionUrl();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("popstate", onPop);
    };
  }, []);
  useEffect(() => subscribeSelectionAnalytics(), []);
  useEffect(() => {
    applyLocationMode();
  }, [pathname]);
  if (!pageInfo(pathname).found) return children;
  return (
    <div
      className={s.shell}
      style={{ "--accent": colorById(color).accent } as React.CSSProperties}
    >
      <a className={s.skipLink} href="#main">
        コンテンツへスキップ
      </a>
      <Navigation />
      <VisualEnhancements />
      <RouteMetadata />
      <SelectionSummary />
      <main
        ref={main}
        id="main"
        tabIndex={-1}
        className={s.main}
        data-mode={mode}
      >
        {!ready && pathname !== "/" ? (
          children
        ) : (
          <ModeBoundary key={mode}>
            {mode === "home" && (
              <>
                <Hero />
                <CinematicHairJourney />
                <HairUnwovenGallery />
              </>
            )}
            {mode === "concept" && <Concept />}
            {mode === "style" && <StyleExperience />}
            {mode === "color" && <StyleExperience colorMode />}
            {mode === "stylist" && <StylistExperience />}
            {mode === "menu" && <MenuPlan />}
            {mode === "booking" && <Booking />}
          </ModeBoundary>
        )}
      </main>
      {mode !== "home" && (
        <footer className={s.footer}>
          <span>
            {site.name} / HAIR DESIGN STUDIO
            {site.address && (
              <>
                <br />
                {site.address}
              </>
            )}
            {site.phone && (
              <>
                <br />
                {site.phone}
              </>
            )}
          </span>
          <span>HAIR IS IDENTITY.</span>
          <span>© 2026 {site.name}</span>
        </footer>
      )}
      <MobileNavigation />
      {salonOpen && <ModeBoundary isSalon><SalonOverlay /></ModeBoundary>}
    </div>
  );
}
