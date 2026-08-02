"use client";

import { useEffect } from "react";

/**
 * How deep you have scrolled, published to CSS.
 *
 * The hero puts you on the surface of the water, so scrolling past it is a
 * dive: the water closes over the page and darkens toward black by the time
 * you reach the footer. This hook publishes two numbers on <html> and nothing
 * else:
 *
 *   --depth   0 at the waterline → 1 at the seafloor (the end of the page)
 *   --water   how opaque the water is, easing in across the first half
 *
 * DARK MODE ONLY. In the light theme the page is a bright, foggy overcast
 * morning and nothing sinks - the effect is off entirely, not merely faint.
 * Two reasons, one taste and one structural:
 *
 *   • It looked wrong. Dragging a light page down into the dark meant the
 *     text had to flip from dark-on-light to light-on-dark partway through
 *     the scroll, and there is no way to make that gradual: a mid-tone
 *     background has poor contrast with dark text AND with light text, so the
 *     switch has to happen all at once, and a page changing polarity under
 *     you as you read is jarring.
 *   • Restricted to dark mode the problem disappears rather than being
 *     managed. The palette is already light-on-dark, so the water can fade in
 *     as gradually as it likes - darkening the background under light text
 *     only ever RAISES contrast, never lowers it.
 *
 * WHY IT WRITES TO THE DOM AND NOT TO REACT STATE. This updates on every
 * animation frame while you scroll. Putting it in useState would re-render
 * the component tree at 60fps for a value only CSS consumes. Setting a custom
 * property on <html> costs one style recalculation and skips React entirely -
 * the same reasoning as the scroll spy in ui/NavLinks.tsx.
 */

/** Water reaches full opacity by this fraction of the descent. */
const WATER_RAMP = 2;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Where the dive begins, in scroll pixels: a little before the hero's bottom
 * edge, so you are already sinking as the waves reach the top of the screen
 * rather than snapping into water afterwards.
 */
function waterlineTop(): number {
  const hero = document.querySelector("header");
  const heroBottom = hero ? hero.getBoundingClientRect().height : window.innerHeight;
  return Math.max(0, heroBottom - window.innerHeight * 0.6);
}

export function useDepth(): void {
  useEffect(() => {
    const root = document.documentElement;

    function apply() {
      // The theme can change under us at any scroll position - the nav's
      // toggle just flips this attribute - so it is re-read every frame
      // rather than captured once.
      if (root.getAttribute("data-theme") !== "dark") {
        root.style.setProperty("--depth", "0");
        root.style.setProperty("--water", "0");
        return;
      }

      const start = waterlineTop();
      const maxScroll = root.scrollHeight - window.innerHeight;
      // A page shorter than the viewport has no descent to speak of.
      const span = maxScroll - start;
      const depth = span > 0 ? clamp01((window.scrollY - start) / span) : 0;

      root.style.setProperty("--depth", depth.toFixed(4));
      root.style.setProperty("--water", clamp01(depth * WATER_RAMP).toFixed(4));
    }

    // Sampled once per frame rather than once per scroll event: flicking down
    // a long page stays cheap, and the value is only read at paint time.
    let queued = false;
    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        apply();
      });
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    // Flipping the theme mid-page has to drain or fill the water immediately,
    // without waiting for the next scroll.
    const themeWatcher = new MutationObserver(schedule);
    themeWatcher.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    apply(); // initial value (e.g. landing on a #section deep link)

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      themeWatcher.disconnect();
      // Leaving these set would strand the page mid-dive if this unmounts.
      root.style.removeProperty("--depth");
      root.style.removeProperty("--water");
    };
  }, []);
}
