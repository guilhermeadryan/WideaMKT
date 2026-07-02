// Google Analytics 4 helper.
// Set VITE_GA4_ID (e.g. "G-XXXXXXXXXX") in your .env to enable tracking.

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const GA_ID = import.meta.env.VITE_GA4_ID as string | undefined;
export const isAnalyticsEnabled = () =>
  typeof window !== "undefined" && !!GA_ID && typeof window.gtag === "function";

export function track(event: string, params: Record<string, unknown> = {}) {
  if (!isAnalyticsEnabled()) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[analytics:disabled]", event, params);
    }
    return;
  }
  window.gtag("event", event, params);
}

export function trackPageview(path: string, title?: string) {
  if (!isAnalyticsEnabled() || !GA_ID) return;
  window.gtag("config", GA_ID, { page_path: path, page_title: title });
}
