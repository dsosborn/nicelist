export type TrialEventName =
  | "page_view"
  | "sign_up"
  | "sign_in"
  | "create_list"
  | "add_gift"
  | "copy_share_link"
  | "reserve_gift"
  | "mark_purchased"
  | "reveal_list"
  | "open_shopping_list";

const ALLOWED_EVENTS = new Set<TrialEventName>([
  "page_view",
  "sign_up",
  "sign_in",
  "create_list",
  "add_gift",
  "copy_share_link",
  "reserve_gift",
  "mark_purchased",
  "reveal_list",
  "open_shopping_list",
]);

export type DataLayerEntry = {
  event: TrialEventName;
  page_location: string;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function scrubPageAddress(rawHref: string): string {
  try {
    const parsed = new URL(rawHref, "https://nicelist.co");
    parsed.searchParams.delete("t");
    parsed.searchParams.delete("id");
    parsed.searchParams.delete("email");
    parsed.searchParams.delete("code");
    parsed.searchParams.delete("state");
    parsed.hash = "";
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return "https://nicelist.co/";
  }
}

export function buildTrialEvent(
  event: TrialEventName,
  rawHref: string,
): DataLayerEntry | null {
  if (!ALLOWED_EVENTS.has(event)) return null;
  return {
    event,
    page_location: scrubPageAddress(rawHref),
  };
}

export function trackTrialEvent(event: TrialEventName, rawHref?: string) {
  if (typeof window === "undefined") return;
  const href = rawHref ?? window.location.href;
  const payload = buildTrialEvent(event, href);
  if (!payload) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}
