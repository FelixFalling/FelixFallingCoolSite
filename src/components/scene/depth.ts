"use client";

import { useEffect } from "react";

/**
 * How deep you have scrolled, published to CSS.
 *
 * The hero puts you on the surface of the water; everything below it is a
 * dive. This hook turns the scroll position into two things the stylesheet
 * can use, and nothing else:
 *
 *   --depth   0 at the waterline → 1 at the seafloor (the end of the page)
 *   --water   how opaque the water layer is: reaches 1 EARLY (see below)
 *   [data-submerged]  present once you are properly under
 *
 * WHY IT WRITES TO THE DOM AND NOT TO REACT STATE. This updates on every
 * animation frame while you scroll. Putting it in useState would re-render
 * the component tree at 60fps for a value only CSS consumes. Setting a custom
 * property on <html> instead costs one style recalculation and skips React
 * entirely - the same reason the scroll spy in ui/NavLinks.tsx samples in a
 * requestAnimationFrame rather than on every scroll event.
 *
 * WHY THE WATER STEPS INSTEAD OF FADING IN. The obvious version fades the
 * water in gradually as you scroll. It was built that way first, and it broke
 * readability: the page text is dark-on-light until the palette flips, so
 * every frame of that fade put dark text on a darker and darker background.
 * Measured mid-fade, the About paragraph sat near 3:1 - under the 4.5:1 this
 * site holds itself to everywhere else.
 *
 * There is no crossfade that avoids this. Somewhere in the middle the
 * background is a mid-tone, and a mid-tone has poor contrast with dark text
 * AND with light text. So the water and the palette switch together, in one
 * step, and CSS gives both the same 0.25s transition the theme toggle already
 * uses - a transition the site has always had and axe has always been happy
 * with. Contrast is only ever "light palette on pale page" or "dark palette
 * on dark water", both audited.
 *
 * --depth keeps climbing smoothly below the waterline, so the water still
 * deepens toward black as you descend. That part is free: darkening under
 * light text only raises contrast.
 */

/** Past this much of the descent you are under, and the palette flips. */
const SUBMERGE_AT = 0.02;

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
      const start = waterlineTop();
      const maxScroll = root.scrollHeight - window.innerHeight;
      // A page shorter than the viewport has no descent to speak of.
      const span = maxScroll - start;
      const depth = span > 0 ? clamp01((window.scrollY - start) / span) : 0;
      const submerged = depth >= SUBMERGE_AT;

      root.style.setProperty("--depth", depth.toFixed(4));
      // Binary, not a ramp - see the note above. CSS transitions the step.
      root.style.setProperty("--water", submerged ? "1" : "0");
      if (submerged) root.setAttribute("data-submerged", "");
      else root.removeAttribute("data-submerged");
    }

    // Sampled once per frame rather than once per scroll event: flicking down
    // a long page stays cheap, and the value is only ever read at paint time
    // anyway.
    let queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        apply();
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply(); // set the initial value (e.g. landing on a #section deep link)

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      // Leaving these set would strand the page mid-dive if this ever unmounts.
      root.style.removeProperty("--depth");
      root.style.removeProperty("--water");
      root.removeAttribute("data-submerged");
    };
  }, []);
}
