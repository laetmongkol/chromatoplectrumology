"use client";

import { useEffect } from "react";

/**
 * Hides the top navigation while the page scrolls down and shows it again on any upward scroll.
 * It only sets two attributes on <html>; the styles live in globals.css:
 *   data-nav="hidden"  nav is slid out of view
 *   data-scrolled      page is past the top (the landing nav gets a solid background)
 */
export default function ScrollNav() {
  useEffect(() => {
    const root = document.documentElement;
    let last = window.scrollY;
    let queued = false;

    const update = () => {
      queued = false;
      const y = Math.max(0, window.scrollY);
      if (y > 8) root.setAttribute("data-scrolled", "");
      else root.removeAttribute("data-scrolled");

      const delta = y - last;
      if (y <= 80) {
        root.removeAttribute("data-nav");
        last = y;
      } else if (delta > 6) {
        root.setAttribute("data-nav", "hidden");
        last = y;
      } else if (delta < -6) {
        root.removeAttribute("data-nav");
        last = y;
      }
    };
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    // keyboard users tabbing into the nav must be able to see it
    const reveal = () => root.removeAttribute("data-nav");

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", reveal);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", reveal);
      root.removeAttribute("data-nav");
      root.removeAttribute("data-scrolled");
    };
  }, []);

  return null;
}
