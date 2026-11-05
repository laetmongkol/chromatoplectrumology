"use client";

import { useEffect, useState } from "react";

export interface Step {
  id: string;
  label: string;
}

/**
 * Numbered step indicator fixed to the right edge (01, 02, 03 ...). The step whose section is in view is highlighted
 * and shows its label; a thin line below fills as the page is scrolled. Click a number to glide to that section.
 * Colours use mix-blend-mode so it reads on both the hero image and the plain page, in light and dark themes.
 */
export default function ScrollSteps({ steps, scrollLabel }: { steps: Step[]; scrollLabel: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = steps.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Math.max(0, steps.findIndex((s) => s.id === e.target.id)));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));

    const bar = document.getElementById("steps-progress");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleY(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [steps]);

  return (
    <nav className="steps" aria-label={scrollLabel}>
      <span className="steps-label">{scrollLabel}</span>
      <ol>
        {steps.map((s, i) => (
          <li key={s.id} className={i === active ? "on" : ""}>
            <a href={`#${s.id}`} aria-current={i === active ? "step" : undefined}>
              <span className="steps-name">{s.label}</span>
              <span className="steps-num">{String(i + 1).padStart(2, "0")}</span>
            </a>
          </li>
        ))}
      </ol>
      <span className="steps-track" aria-hidden="true">
        <i id="steps-progress" />
      </span>
    </nav>
  );
}
