"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackTrialEvent } from "@/lib/analytics";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "";

export function TagManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackTrialEvent("page_view");
    if (pathname === "/shopping") {
      trackTrialEvent("open_shopping_list");
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!GTM_ID || typeof window === "undefined") return;
    if (document.getElementById("nicelist-gtm-loader")) return;

    const loadContainer = () => {
      if (document.getElementById("nicelist-gtm-loader")) return;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        "gtm.start": Date.now(),
        event: "gtm.js",
      });
      const script = document.createElement("script");
      script.id = "nicelist-gtm-loader";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
      document.head.appendChild(script);
    };

    const scheduleAfterPaint = () => {
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
          loadContainer,
        );
      } else {
        setTimeout(loadContainer, 1);
      }
    };

    if (document.readyState === "complete") {
      scheduleAfterPaint();
      return;
    }
    window.addEventListener("load", scheduleAfterPaint, { once: true });
    return () => {
      window.removeEventListener("load", scheduleAfterPaint);
    };
  }, []);

  return null;
}
