"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

type Consent = { decided: boolean; analytics: boolean; marketing: boolean };

function deviceClass(): string {
  const width = window.matchMedia("(max-width: 640px)").matches;
  const touch = navigator.maxTouchPoints > 0;
  if (width) return "mobile";
  if (touch && window.matchMedia("(max-width: 1024px)").matches) return "tablet";
  return "desktop";
}

export default function SiteAnalytics() {
  const pathname = usePathname();
  const consent = useRef<Consent>({ decided: false, analytics: false, marketing: false });
  const pathRef = useRef(pathname || "/");
  pathRef.current = pathname || "/";

  const send = useCallback((event: { kind: "page_view" | "web_vital"; pagePath: string; metric?: string; value?: number }) => {
    if (!consent.current.analytics && !(consent.current.marketing && event.kind === "page_view")) return;
    void fetch("/api/analytics", {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ ...event, device: deviceClass() }),
    }).catch(() => undefined);
  }, []);

  useReportWebVitals((metric) => {
    if (consent.current.analytics) send({ kind: "web_vital", pagePath: pathRef.current, metric: metric.name, value: metric.value });
  });

  useEffect(() => {
    let live = true;
    fetch("/api/privacy/consent", { cache: "no-store" }).then((res) => res.json()).then((value: Consent) => {
      if (!live) return;
      consent.current = value;
      if (value.analytics || value.marketing) send({ kind: "page_view", pagePath: pathRef.current });
    }).catch(() => undefined);
    const update = (event: Event) => {
      consent.current = (event as CustomEvent<Consent>).detail;
      if (consent.current.analytics || consent.current.marketing) send({ kind: "page_view", pagePath: pathRef.current });
    };
    window.addEventListener("wec-privacy-updated", update);
    return () => { live = false; window.removeEventListener("wec-privacy-updated", update); };
  }, [send]);

  useEffect(() => {
    if (consent.current.analytics || consent.current.marketing) send({ kind: "page_view", pagePath: pathname || "/" });
  }, [pathname, send]);
  return null;
}
