"use client";

import { useEffect } from "react";

/** Enables homepage-only background styles on the document (see globals.css `.homepage-route`). */
export function HomepageRouteShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add("homepage-route");
    return () => {
      document.body.classList.remove("homepage-route");
    };
  }, []);

  return <>{children}</>;
}
