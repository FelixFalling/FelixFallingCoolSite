"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps a section and fades it up into view the first time it's scrolled to.
 *
 * The `"use client"` line at the top is important: this component uses browser
 * APIs (IntersectionObserver), so it must run in the browser. Most components
 * in this project are "server components" that render to static HTML at build
 * time - you only add `"use client"` when a component needs interactivity.
 *
 * WHO HIDES THE SECTION: the CSS does, not this file. `html.js .reveal` in
 * globals.css starts each section transparent, and the theme script in the
 * layout adds that `js` class before the first paint - so a section is never
 * painted and then blanked. This component only decides WHEN to reveal it, by
 * adding `.is-visible`. Two consequences worth knowing:
 *
 *   • With JavaScript off, `html.js` never matches, so every section stays
 *     visible as plain static HTML - the content is never lost.
 *   • Reduced motion is handled in the CSS (the sections simply start
 *     visible), so there's nothing to check for it here.
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

    // No IntersectionObserver: reveal immediately rather than leaving the
    // section hidden with no way to bring it back.
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // animate once, then stop watching
          }
        }
      },
      // rootMargin extends the "viewport" 120px downward, so a section starts
      // fading in just before it scrolls into view - on phones this means the
      // content is already appearing as you reach it, not lagging behind.
      { threshold: 0.01, rootMargin: "0px 0px 120px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className="section reveal">
      {children}
    </section>
  );
}
