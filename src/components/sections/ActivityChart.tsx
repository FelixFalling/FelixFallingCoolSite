"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Activity.module.css";

/**
 * The contribution-graph image itself, split out as a client component purely
 * so it can handle its own failure.
 *
 * ghchart.rshah.org is a small free third-party service (see Activity.tsx).
 * If it's down, renamed, or blocked, an <img> would leave a broken-image icon
 * sitting in the middle of the page. Instead the whole box removes itself and
 * the caption below - which already links to the GitHub profile - carries the
 * section on its own.
 */
export default function ActivityChart({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // The onError prop alone isn't enough. This <img> is server-rendered into
  // the static HTML, so the browser starts (and can finish) loading it before
  // React hydrates and attaches any handler - a request that fails in that
  // window fires its error event into the void and the broken image stays.
  // So on mount, ask the image directly whether it already failed: a finished
  // image (complete) with no dimensions (naturalWidth === 0) is a failed one.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return null;

  return (
    // tabIndex + role: the chart box scrolls sideways on small screens, so
    // keyboard users must be able to focus it and scroll with arrow keys.
    <div
      className={`salvage adrift ${styles.chartScroll}`}
      style={{ animationDuration: "14.5s", animationDelay: "-9.2s" }}
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      <img
        ref={imgRef}
        className={styles.chart}
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        // Intrinsic size of the ghchart SVG. With height:auto in CSS these
        // give the browser the aspect ratio up front, so it reserves the row
        // instead of shoving the caption down when the remote chart arrives
        // (cumulative layout shift).
        width={663}
        height={104}
      />
    </div>
  );
}
