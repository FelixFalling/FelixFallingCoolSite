"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps a section and fades it up into view the first time it's scrolled to.
 *
 * The `"use client"` line at the top is important: this component uses browser
 * APIs (IntersectionObserver), so it must run in the browser. Most components
 * in this project are "server components" that render to static HTML at build
 * time — you only add `"use client"` when a component needs interactivity.
 */
export default function Reveal({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect users who prefer no motion — show it immediately, no animation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      return;
    }

    el.style.opacity = "0";
    el.style.transform = "translateY(18px)";
    el.style.transition = "opacity 0.7s ease, transform 0.7s ease";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            observer.unobserve(el); // animate once, then stop watching
          }
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className="section">
      {children}
    </section>
  );
}
