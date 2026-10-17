"use client";

import { useEffect, useState } from "react";

function forcedOff(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData) || /[?&]motion=off\b/.test(window.location.search);
}

/**
 * Whether the scroll-driven experience should run.
 *
 * The initial decision is made before paint by the inline script in
 * app/layout.tsx (it sets `html.motion`). This hook reads that decision
 * after hydration and keeps it in sync if the OS reduced-motion setting
 * changes while the page is open.
 *
 * Returns `null` during SSR / before mount so callers can skip work.
 */
export function useMotionEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    setEnabled(root.classList.contains("motion"));

    const onChange = () => {
      const on = !mq.matches && !forcedOff();
      root.classList.toggle("motion", on);
      setEnabled(on);
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return enabled;
}
