"use client";

import { useEffect, useState } from "react";
import styles from "./Nav.module.css";

/**
 * The nav's section links, plus the "scroll spy" that highlights whichever
 * section you're currently looking at.
 *
 * This is split out of Nav.tsx so that only this small piece is a client
 * component - Nav itself stays server-rendered and keeps the resume data out
 * of the JavaScript bundle.
 *
 * Experience/Education links are omitted while those sections are hidden -
 * see the PRIVACY note in app/page.tsx.
 */
const links = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#games", label: "Games" },
  { href: "#skills", label: "Skills" },
  { href: "#activity", label: "Activity" },
  { href: "#contact", label: "Contact" },
];

/** The section ids, in page order - the spy relies on this being top-to-bottom. */
const IDS = links.map((link) => link.href.slice(1));

/**
 * Returns the id of the section you're currently reading, or null when you're
 * up in the hero above all of them.
 *
 * HOW IT DECIDES - and why it isn't the usual recipe. The obvious rule is "the
 * section whose top has scrolled past a fixed line near the top of the
 * viewport". That rule breaks at the end of a page: scrolling stops while the
 * last couple of sections are still below the line, so they can never become
 * active. It's not hypothetical - measured on this page, a line at 40% left
 * the Activity link permanently unlit at every viewport size. Picking
 * "whichever section fills most of the screen" instead has the mirror-image
 * flaw: short sections lose to their tall neighbours, and About never lit up.
 *
 * So the line MOVES. In document coordinates it sits at:
 *
 *     scrollY + viewportHeight × (scrollY / maxScroll)
 *
 * which is the top of the viewport when you're at the top of the page, and
 * slides down to the bottom of the viewport exactly as you reach the bottom of
 * the page. That last part is the point: at maximum scroll the line has
 * reached the very end of the document, so it has swept through every section
 * on the way - including the ones bunched into the final screenful. Each
 * section gets a share of the scroll proportional to its height, and none is
 * unreachable.
 */
function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    function pick() {
      const scrollY = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;
      const line = scrollY + window.innerHeight * progress;

      // The last section the line has reached. Taking the LAST one rather
      // than testing "is the line inside this section" means the gaps between
      // sections (their padding) don't blink the highlight off.
      let current: string | null = null;
      for (const section of sections) {
        const top = section.getBoundingClientRect().top + scrollY;
        if (top <= line) current = section.id;
      }
      setActive(current);
    }

    // Sampled once per animation frame rather than once per scroll event, so
    // flicking down a long page stays cheap: six getBoundingClientRect reads
    // per frame, and only while the page is actually moving.
    let queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        pick();
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    pick(); // set the initial state (e.g. when landing on a #section deep link)

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return active;
}

export default function NavLinks() {
  const active = useActiveSection();

  return (
    <div className={styles.links}>
      {links.map((link) => {
        const isActive = link.href.slice(1) === active;
        return (
          <a
            key={link.href}
            href={link.href}
            // aria-current tells a screen reader which link is the one you're
            // on - the non-visual equivalent of the underline below.
            aria-current={isActive ? "true" : undefined}
            className={isActive ? `${styles.link} ${styles.linkActive}` : styles.link}
          >
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
