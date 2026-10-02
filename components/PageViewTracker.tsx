"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin's own navigation around the panel — that would
    // pollute "visitor" numbers with your own clicks.
    if (pathname?.startsWith("/08088adminpanel")) return;

    fetch("/api/track-pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname })
    }).catch(() => {
      // Silently ignore — a missed pageview is never worth bothering
      // the visitor or the console about.
    });
  }, [pathname]);

  return null;
}
