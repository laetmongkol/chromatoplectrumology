"use client";

import { useEffect, useRef } from "react";
import { resolveTheme } from "@/lib/theme";

/** Slow liquid-light canvas used behind the landing hero. Follows the light/dark theme. */
export default function LiquidBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const cx = canvas?.getContext("2d");
    if (!canvas || !cx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const W = canvas.width;
    const H = canvas.height;
    let t = 0;
    let raf = 0;

    const frame = () => {
      t += 0.004;
      const dark = resolveTheme() === "dark";
      cx.fillStyle = dark ? "#0d0706" : "#fbf9f6";
      cx.fillRect(0, 0, W, H);
      const blobs: [number, string, number][] = dark
        ? [
            [0.2, "160,224,171", 0.95],
            [0.55, "255,172,46", 0.95],
            [0.9, "165,45,37", 0.95],
          ]
        : [
            [0.2, "140,205,150", 0.75],
            [0.55, "255,178,70", 0.65],
            [0.9, "225,110,90", 0.55],
          ];
      blobs.forEach(([px, rgb, alpha], i) => {
        const x = W * px + Math.sin(t * 1.2 + i * 2) * 200;
        const y = H * 0.55 + Math.cos(t + i * 1.7) * 150;
        const g = cx.createRadialGradient(x, y, 0, x, y, 520);
        g.addColorStop(0, `rgba(${rgb},${alpha})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        cx.fillStyle = g;
        cx.fillRect(0, 0, W, H);
      });
      if (dark) {
        cx.fillStyle = "rgba(0,0,0,.2)";
        cx.fillRect(0, 0, W, H);
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    frame();
    // reduced motion draws one frame only, so redraw when the theme changes
    const observer = new MutationObserver(() => {
      if (reduce) frame();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={ref} width={1200} height={720} aria-hidden="true" />;
}
