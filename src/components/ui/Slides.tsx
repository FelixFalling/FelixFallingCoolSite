"use client";

import { useRef, useState } from "react";
import type { ProjectImage } from "@/data/resume";
import styles from "./Slides.module.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * A small swipeable screenshot slideshow, used on project cards.
 *
 * How it works: the track is a horizontal strip with CSS `scroll-snap`, so on
 * phones you just swipe it like a photo gallery — no JavaScript involved. The
 * arrows and dots are for mouse users: they scroll the track one card-width,
 * and the dots light up based on which slide is in view (tracked by the
 * onScroll handler below).
 *
 * With a single image it renders as a plain picture — no arrows, no dots.
 */
export default function Slides({ images, title }: { images: ProjectImage[]; title: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Which slide is in view = scroll position ÷ slide width, rounded.
  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    // Respect reduced-motion: jump instantly instead of gliding.
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: clamped * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }

  const single = images.length === 1;

  return (
    <figure className={styles.slides} aria-label={`${title} screenshots`}>
      {/* tabIndex + role: the track scrolls horizontally, so keyboard users
          must be able to focus it and use arrow keys (or tab to the buttons). */}
      <div
        className={styles.track}
        ref={trackRef}
        onScroll={single ? undefined : handleScroll}
        tabIndex={single ? undefined : 0}
        role={single ? undefined : "region"}
        aria-label={single ? undefined : `${title} screenshots (scrolls horizontally)`}
      >
        {images.map((img) => (
          <img
            key={img.src}
            className={styles.slide}
            src={`${BASE_PATH}/${img.src}`}
            alt={img.alt}
            loading="lazy"
          />
        ))}
      </div>

      {!single && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous screenshot"
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            onClick={() => goTo(active + 1)}
            disabled={active === images.length - 1}
            aria-label="Next screenshot"
          >
            ›
          </button>

          <div className={styles.dots}>
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                className={i === active ? `${styles.dot} ${styles.dotActive}` : styles.dot}
                onClick={() => goTo(i)}
                aria-label={`Go to screenshot ${i + 1} of ${images.length}`}
              />
            ))}
          </div>
        </>
      )}
    </figure>
  );
}
