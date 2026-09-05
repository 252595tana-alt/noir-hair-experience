export type AnalyticsEvent =
  | "style_view"
  | "style_select"
  | "hair_rotate"
  | "color_try"
  | "color_apply"
  | "stylist_view"
  | "stylist_select"
  | "menu_view"
  | "booking_open"
  | "booking_line_click"
  | "booking_web_click"
  | "salon_open";
export type EventProperties = {
  styleId?: string | null;
  color?: string;
  stylistId?: string | null;
  menus?: string[];
  configured?: boolean;
  angle?: number;
};
type Sink = (event: AnalyticsEvent, properties: EventProperties) => void;
let sink: Sink = () => {};
/** Install a consent-aware GA4 adapter here later. No personal data or external requests by default. */
export function configureAnalytics(next: Sink) {
  sink = next;
  return () => {
    sink = () => {};
  };
}
export function track(event: AnalyticsEvent, properties: EventProperties = {}) {
  try {
    sink(event, properties);
  } catch {
    /* Analytics never blocks booking. */
  }
}
